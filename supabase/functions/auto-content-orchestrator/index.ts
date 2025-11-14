import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const ADMIN_EMAIL = 'pcpc233@gmail.com';

async function sendAlert(supabase: any, subject: string, body: string) {
  try {
    await supabase.from('alert_email_queue').insert({
      recipient: ADMIN_EMAIL,
      subject,
      body,
      priority: 'high',
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to queue alert:', error);
  }
}

async function detectAnomaly(supabase: any, published: number, expected: number): Promise<boolean> {
  const deviation = Math.abs(published - expected) / expected;
  const isAnomaly = deviation > 0.7;
  
  if (isAnomaly) {
    await sendAlert(
      supabase,
      '⚠️ [bustime.site] 자동화 이상치 탐지',
      `예상과 다른 수치가 감지되었습니다.\n\n발행된 콘텐츠: ${published}개\n예상 콘텐츠: ${expected}개\n편차율: ${(deviation * 100).toFixed(1)}%\n\n시간: ${new Date().toLocaleString('ko-KR')}`,
    );
  }
  
  return isAnomaly;
}

async function verifyAdminSession(sessionToken: string): Promise<boolean> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: session } = await supabase
      .from('admin_sessions')
      .select('admin_id, expires_at')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!session) {
      return false;
    }

    const { data: admin } = await supabase
      .from('admin_users')
      .select('is_active')
      .eq('id', session.admin_id)
      .eq('is_active', true)
      .maybeSingle();

    return !!admin;
  } catch (error) {
    console.error('Session verification error:', error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const requestBody = await req.json().catch(() => ({}));
    const sessionToken = requestBody.sessionToken;

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Session token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isValidSession = await verifyAdminSession(sessionToken);

    if (!isValidSession) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const executionLog = {
      started_at: new Date().toISOString(),
      steps: [] as any[],
      total_published: 0,
      errors: [] as any[],
    };

    console.log('🚀 팔트 기반 자동화 시스템 시작...');

    try {
      console.log('🔍 Step 1: 데이터 검증 (50개 조합)...');
      const verifyResponse = await fetch(`${supabaseUrl}/functions/v1/verify-transport-data`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchSize: 50 }),
      });
      
      const verifyData = await verifyResponse.json();
      
      executionLog.steps.push({
        step: 'verify-transport-data',
        success: verifyData.success,
        verified: verifyData.results?.verified || 0,
        failed: verifyData.results?.failed || 0,
        message: verifyData.message,
        timestamp: new Date().toISOString(),
      });
      
      console.log(`✅ 검증 완료: ${verifyData.results?.verified || 0}개 성공`);
    } catch (error) {
      console.error('❌ 데이터 검증 실패:', error);
      executionLog.errors.push({
        step: 'verify-transport-data',
        error: error.message,
      });
      
      await sendAlert(
        supabase,
        '🚨 [bustime.site] 데이터 검증 실패',
        `데이터 검증 단계에서 오류가 발생했습니다.\n\n오류: ${error.message}\n\n시간: ${new Date().toLocaleString('ko-KR')}`,
      );
    }

    try {
      console.log('📝 Step 2: GPT 기반 콘텐츠 10개 생성...');
      const publishResponse = await fetch(`${supabaseUrl}/functions/v1/generate-gpt-content?limit=10`, {
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      });

      const publishData = await publishResponse.json();
      
      executionLog.steps.push({
        step: 'generate-gpt-content',
        success: publishData.success,
        published: publishData.published || 0,
        message: publishData.message,
        errors: publishData.errors,
        timestamp: new Date().toISOString(),
      });

      executionLog.total_published = publishData.published || 0;
      console.log(`✅ ${publishData.published || 0}개 GPT 콘텐츠 생성 완료`);

      const anomalyDetected = await detectAnomaly(supabase, publishData.published || 0, 10);
      
      if (publishData.published === 0) {
        await sendAlert(
          supabase,
          '🚨 [bustime.site] GPT 콘텐츠 생성 0건',
          `콘텐츠가 하나도 생성되지 않았습니다.\n\n원인:\n- 검증된 데이터가 없을 수 있음\n- GPT API 오류\n- 데이터베이스 연결 문제\n\n로그:\n${JSON.stringify(executionLog, null, 2)}\n\n시간: ${new Date().toLocaleString('ko-KR')}`,
        );
      } else {
        await sendAlert(
          supabase,
          '✅ [bustime.site] GPT 콘텐츠 생성 완료',
          `${publishData.published}개의 팩트 기반 SEO 콘텐츠가 생성되었습니다.\n\n실제 데이터 + GPT로 자연스러운 장문 콘텐츠 제작\n\n시간: ${new Date().toLocaleString('ko-KR')}`,
        );
      }
    } catch (error) {
      console.error('❌ GPT 콘텐츠 생성 실패:', error);
      executionLog.errors.push({
        step: 'generate-gpt-content',
        error: error.message,
      });

      await sendAlert(
        supabase,
        '🚨 [bustime.site] GPT 콘텐츠 생성 실패',
        `GPT 콘텐츠 생성 단계에서 오류가 발생했습니다.\n\n오류: ${error.message}\n스택:\n${error.stack}\n\n시간: ${new Date().toLocaleString('ko-KR')}`,
      );
    }

    executionLog.steps.push({
      step: 'completed',
      timestamp: new Date().toISOString(),
    });

    const logStatus = executionLog.errors.length === 0 ? 'success' : 'partial_success';
    const anomalyDetected = executionLog.total_published === 0 || executionLog.errors.length > 0;
    
    await supabase.from('automation_logs').insert({
      log_type: 'daily_automation',
      status: logStatus,
      details: executionLog,
      anomaly_detected: anomalyDetected,
      anomaly_details: anomalyDetected ? {
        published: executionLog.total_published,
        errors: executionLog.errors,
      } : null,
      created_at: new Date().toISOString(),
    });

    await supabase
      .from('automation_schedules')
      .update({
        last_run_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('function_name', 'auto-content-orchestrator');

    const summary = {
      success: true,
      execution_log: executionLog,
      summary: {
        total_steps: executionLog.steps.length,
        successful_steps: executionLog.steps.filter(s => s.success !== false).length,
        failed_steps: executionLog.errors.length,
        content_published: executionLog.total_published,
        anomaly_detected: anomalyDetected,
      },
      message: `✅ 자동화 완료! ${executionLog.total_published}개 팔트 기반 콘텐츠 발행됨`,
    };

    console.log('🎉 팔트 기반 자동화 완료!');
    console.log(`📊 발행된 콘텐츠: ${executionLog.total_published}개`);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('💥 치명적 오류:', error);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);
    
    await sendAlert(
      supabase,
      '💥 [bustime.site] 자동화 치명적 오류',
      `auto-content-orchestrator에서 치명적 오류 발생\n\n오류: ${error.message}\n스택:\n${error.stack}\n\n시간: ${new Date().toLocaleString('ko-KR')}`,
    );
    
    await supabase.from('automation_logs').insert({
      log_type: 'daily_automation',
      status: 'failed',
      details: {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      anomaly_detected: true,
      anomaly_details: {
        fatal_error: true,
        message: error.message,
      },
      created_at: new Date().toISOString(),
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});