import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const baseUrl = `${supabaseUrl}/functions/v1`;

    const results = {
      generated: 0,
      published: 0,
      errors: [] as string[],
    };

    // 1. 롱테일 키워드 조합 생성 (50개)
    try {
      const generateRes = await fetch(`${baseUrl}/generate-longtail-keywords?limit=50`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });
      const generateData = await generateRes.json();
      if (generateData.success) {
        results.generated = generateData.generated;
      } else {
        results.errors.push(`생성 실패: ${generateData.error}`);
      }
    } catch (error) {
      results.errors.push(`생성 오류: ${error.message}`);
    }

    // 2. 콘텐츠 발행 (10개)
    try {
      const publishRes = await fetch(`${baseUrl}/publish-longtail-content?limit=10`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });
      const publishData = await publishRes.json();
      if (publishData.success) {
        results.published = publishData.published;
      } else {
        results.errors.push(`발행 실패: ${publishData.error}`);
      }
    } catch (error) {
      results.errors.push(`발행 오류: ${error.message}`);
    }

    // 3. 사이트맵 업데이트
    try {
      await fetch(`${baseUrl}/generate-sitemap`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });
    } catch (error) {
      results.errors.push(`사이트맵 오류: ${error.message}`);
    }

    // 4. 데이터베이스에 실행 로그 저장
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from('automation_logs').insert({
      job_type: 'daily_automation',
      generated_count: results.generated,
      published_count: results.published,
      errors: results.errors,
      executed_at: new Date().toISOString(),
    }).catch(() => {});

    return new Response(
      JSON.stringify({
        success: true,
        message: `매일 자동화 완료`,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
