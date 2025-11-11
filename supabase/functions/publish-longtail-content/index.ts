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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 10;

    // 미발행 조합 가져오기
    const { data: combinations, error: combError } = await supabase
      .from('longtail_combinations')
      .select(`
        *,
        service:services(*),
        location:keyword_locations(*),
        action:keyword_actions(*),
        season:keyword_seasons(*),
        modifier:keyword_modifiers(*)
      `)
      .eq('is_published', false)
      .order('search_volume', { ascending: false })
      .limit(limit);

    if (combError) throw combError;
    if (!combinations || combinations.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          published: 0,
          message: '발행할 조합이 없습니다.',
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const published = [];

    for (const combination of combinations) {
      try {
        const service = combination.service;
        const location = combination.location;
        const action = combination.action;
        const season = combination.season;

        if (!service || !location || !action) continue;

        // 템플릿 가져오기
        const { data: template } = await supabase
          .from('content_templates')
          .select('*')
          .eq('category_id', service.category_id)
          .maybeSingle();

        if (!template) continue;

        // 변수 치환
        let title = template.title_template
          .replace(/{{location}}/g, location.name)
          .replace(/{{service}}/g, service.name)
          .replace(/{{action}}/g, action.action)
          .replace(/{{season}}/g, season?.name || '');

        let description = template.description_template
          .replace(/{{location}}/g, location.name)
          .replace(/{{service}}/g, service.name)
          .replace(/{{action}}/g, action.action)
          .replace(/{{season}}/g, season?.name || '');

        let content = template.content_template
          .replace(/{{location}}/g, location.name)
          .replace(/{{service}}/g, service.name)
          .replace(/{{action}}/g, action.action)
          .replace(/{{season}}/g, season?.name || '');

        // 조합 발행 상태 업데이트
        const { error: updateError } = await supabase
          .from('longtail_combinations')
          .update({
            is_published: true,
            published_at: new Date().toISOString(),
          })
          .eq('id', combination.id);

        if (updateError) throw updateError;

        published.push({
          id: combination.id,
          title,
          slug: combination.generated_slug,
          search_volume: combination.search_volume,
        });

        // 서비스 조회수 증가
        await supabase.rpc('increment', {
          row_id: service.id,
          table_name: 'services',
          column_name: 'view_count',
        }).catch(() => {});

      } catch (error) {
        console.error(`조합 ${combination.id} 발행 실패:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        published: published.length,
        items: published,
        message: `${published.length}개의 롱테일 콘텐츠가 발행되었습니다.`,
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
