import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function generateRecoveryCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: '이메일을 입력하세요' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, username, email')
      .eq('email', email)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !admin) {
      return new Response(
        JSON.stringify({ success: false, error: '등록된 이메일이 없습니다' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const recoveryCode = generateRecoveryCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { error: insertError } = await supabase
      .from('admin_recovery_codes')
      .insert({
        admin_id: admin.id,
        recovery_code: recoveryCode,
        email: admin.email,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Failed to insert recovery code:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: '복구 코드 생성 실패' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('\n=== PASSWORD RECOVERY CODE ===');
    console.log(`Email: ${admin.email}`);
    console.log(`Username: ${admin.username}`);
    console.log(`Recovery Code: ${recoveryCode}`);
    console.log(`Expires At: ${expiresAt.toISOString()}`);
    console.log('==============================\n');

    const emailBody = `
안녕하세요,

bustime.site 관리자 계정 비밀번호 복구 코드입니다.

복구 코드: ${recoveryCode}

이 코드는 10분 후 만료됩니다.
코드를 요청하지 않으셨다면 이 메일을 무시하세요.

감사합니다.
bustime.site 관리팀
    `.trim();

    try {
      await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: admin.email,
          subject: '[bustime.site] 비밀번호 복구 코드',
          body: emailBody,
        }),
      });
      console.log('Email queued successfully');
    } catch (emailError) {
      console.error('Email send failed:', emailError);
    }

    await supabase.from('admin_activity_logs').insert({
      admin_id: admin.id,
      action: 'PASSWORD_RECOVERY_REQUESTED',
      resource_type: 'auth',
      details: {
        email: admin.email,
        code_hint: recoveryCode.substring(0, 2) + '****'
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: '복구 코드가 생성되었습니다. Supabase 로그를 확인하세요.',
        debug: {
          hint: `${recoveryCode.substring(0, 3)}***`,
          expires_in_minutes: 10,
          check_supabase_logs: true
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Recovery request error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});