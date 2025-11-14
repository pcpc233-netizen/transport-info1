import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ContentGenerationResult {
  success: boolean;
  slug?: string;
  error?: string;
  category?: string;
}

async function sendErrorEmail(supabaseUrl: string, supabaseKey: string, errorDetails: string) {
  try {
    await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: '🚨 콘텐츠 자동화 오류 발생',
        message: errorDetails,
        priority: 'high',
      }),
    });
  } catch (e) {
    console.error('이메일 전송 실패:', e);
  }
}

async function generateContentForCategory(
  supabaseUrl: string,
  supabaseKey: string,
  categoryId: string,
  categoryName: string
): Promise<ContentGenerationResult> {
  try {
    // 1. 해당 카테고리의 미발행 키워드 가져오기
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: keyword, error: keywordError } = await supabase
      .from('longtail_keywords')
      .select('*')
      .eq('category_id', categoryId)
      .eq('content_generated', false)
      .order('search_volume', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (keywordError || !keyword) {
      return {
        success: false,
        error: `키워드 없음 (${categoryName})`,
        category: categoryName,
      };
    }

    // 2. GPT로 콘텐츠 생성
    const generateRes = await fetch(`${supabaseUrl}/functions/v1/generate-gpt-content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywordId: keyword.id,
      }),
    });

    const generateData = await generateRes.json();

    if (!generateData.success) {
      return {
        success: false,
        error: `생성 실패: ${generateData.error}`,
        category: categoryName,
      };
    }

    // 3. 바로 발행
    const { error: publishError } = await supabase
      .from('longtail_content_pages')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .eq('slug', generateData.slug);

    if (publishError) {
      return {
        success: false,
        error: `발행 실패: ${publishError.message}`,
        category: categoryName,
      };
    }

    return {
      success: true,
      slug: generateData.slug,
      category: categoryName,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      category: categoryName,
    };
  }
}

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
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 메인 5개 카테고리 선택
    const targetCategories = [
      { slug: 'city-bus', name: '시내버스' },
      { slug: 'airport-bus', name: '공항버스' },
      { slug: 'passport', name: '여권발급' },
      { slug: 'hospital', name: '병원' },
      { slug: 'gtx', name: 'GTX' },
    ];

    // 카테고리 ID 가져오기
    const { data: categories } = await supabase
      .from('service_categories')
      .select('id, slug, name')
      .in('slug', targetCategories.map(c => c.slug));

    if (!categories || categories.length === 0) {
      throw new Error('카테고리를 찾을 수 없습니다');
    }

    const results: ContentGenerationResult[] = [];
    const errors: string[] = [];
    let successCount = 0;

    // 20개 콘텐츠 생성 (5개 카테고리 순환)
    for (let i = 0; i < 20; i++) {
      const categoryIndex = i % 5;
      const category = categories[categoryIndex];

      console.log(`[${i + 1}/20] ${category.name} 콘텐츠 생성 중...`);

      const result = await generateContentForCategory(
        supabaseUrl,
        supabaseKey,
        category.id,
        category.name
      );

      results.push(result);

      if (result.success) {
        successCount++;
        console.log(`✅ 성공: ${result.slug}`);
      } else {
        errors.push(`[${category.name}] ${result.error}`);
        console.error(`❌ 실패: ${result.error}`);
      }

      // 5분 대기 (마지막 콘텐츠는 제외)
      if (i < 19) {
        console.log(`⏳ 5분 대기 중... (다음: ${categories[(i + 1) % 5].name})`);
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
      }
    }

    // 실행 로그 저장
    await supabase.from('automation_logs').insert({
      job_type: 'scheduled_daily_content',
      generated_count: successCount,
      published_count: successCount,
      errors: errors,
      executed_at: new Date().toISOString(),
    });

    // 에러가 있으면 이메일 발송
    if (errors.length > 0) {
      const errorMessage = `
        📊 콘텐츠 자동화 실행 결과

        ✅ 성공: ${successCount}/20
        ❌ 실패: ${errors.length}/20

        🔴 오류 내역:
        ${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

        ⏰ 실행 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
      `;

      await sendErrorEmail(supabaseUrl, supabaseKey, errorMessage);
    }

    // 사이트맵 업데이트
    try {
      await fetch(`${supabaseUrl}/functions/v1/generate-sitemap`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });
    } catch (e) {
      console.error('사이트맵 생성 실패:', e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `매일 자동화 완료 (${successCount}/20 성공)`,
        results: {
          total: 20,
          success: successCount,
          failed: errors.length,
          errors: errors,
          details: results,
        },
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

    // 치명적 오류 발생 시 이메일 발송
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    await sendErrorEmail(
      supabaseUrl,
      supabaseKey,
      `🚨 치명적 오류 발생\n\n${error.message}\n\n${error.stack || ''}`
    );

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
