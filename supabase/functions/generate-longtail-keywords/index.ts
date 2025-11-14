import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Service {
  id: string;
  name: string;
  slug: string;
  category_id: string;
}

interface Location {
  id: string;
  name: string;
  level: string;
  population: number;
}

interface Action {
  id: string;
  action: string;
  priority: number;
}

interface Season {
  id: string;
  name: string;
}

interface Modifier {
  id: string;
  modifier: string;
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

    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 50;

    // 기존 서비스 가져오기
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, slug, category_id')
      .eq('is_active', true)
      .limit(10);

    if (servicesError) throw servicesError;

    // 키워드 데이터 가져오기
    const [locationsRes, actionsRes, seasonsRes, modifiersRes] = await Promise.all([
      supabase.from('keyword_locations').select('*').eq('is_active', true).order('population', { ascending: false }).limit(20),
      supabase.from('keyword_actions').select('*').order('priority', { ascending: false }).limit(10),
      supabase.from('keyword_seasons').select('*').eq('is_active', true).limit(10),
      supabase.from('keyword_modifiers').select('*').limit(10),
    ]);

    const locations = locationsRes.data || [];
    const actions = actionsRes.data || [];
    const seasons = seasonsRes.data || [];
    const modifiers = modifiersRes.data || [];

    const combinations = [];
    let generated = 0;

    // 조합 생성 (서비스 + 지역 + 행동)
    for (const service of (services || [])) {
      if (generated >= limit) break;

      for (const location of locations) {
        if (generated >= limit) break;

        for (const action of actions) {
          if (generated >= limit) break;

          // 기본 조합: [지역] [서비스명] [행동]
          const title = `${location.name} ${service.name} ${action.action}`;
          const slug = `${location.name}-${service.slug}-${action.action}`.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9가-힣-]/g, '');

          // 중복 체크
          const { data: existing } = await supabase
            .from('longtail_combinations')
            .select('id')
            .eq('generated_slug', slug)
            .maybeSingle();

          if (!existing) {
            combinations.push({
              service_id: service.id,
              location_id: location.id,
              action_id: action.id,
              season_id: null,
              modifier_id: null,
              generated_title: title,
              generated_slug: slug,
              search_volume: Math.floor(location.population / 1000),
              competition: 'low',
              is_published: false,
            });
            generated++;
          }
        }
      }
    }

    // 시즌 추가 조합 (일부만)
    if (generated < limit && seasons.length > 0 && combinations.length > 0) {
      const baseCount = Math.min(10, combinations.length);
      for (let i = 0; i < baseCount && generated < limit; i++) {
        const base = combinations[i];
        const season = seasons[i % seasons.length];
        
        const service = services?.find(s => s.id === base.service_id);
        const location = locations.find(l => l.id === base.location_id);
        const action = actions.find(a => a.id === base.action_id);

        if (service && location && action) {
          const title = `${season.name} ${location.name} ${service.name} ${action.action}`;
          const slug = `${season.name}-${location.name}-${service.slug}-${action.action}`.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9가-힣-]/g, '');

          const { data: existing } = await supabase
            .from('longtail_combinations')
            .select('id')
            .eq('generated_slug', slug)
            .maybeSingle();

          if (!existing) {
            combinations.push({
              service_id: service.id,
              location_id: location.id,
              action_id: action.id,
              season_id: season.id,
              modifier_id: null,
              generated_title: title,
              generated_slug: slug,
              search_volume: Math.floor(location.population / 1500),
              competition: 'low',
              is_published: false,
            });
            generated++;
          }
        }
      }
    }

    // 데이터베이스에 저장
    if (combinations.length > 0) {
      const { error: insertError } = await supabase
        .from('longtail_combinations')
        .insert(combinations);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        generated: combinations.length,
        message: `${combinations.length}개의 롱테일 키워드 조합이 생성되었습니다.`,
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
