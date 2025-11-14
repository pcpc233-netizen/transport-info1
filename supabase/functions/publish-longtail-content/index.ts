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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!authHeader || !authHeader.includes(serviceKey!)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Service key required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 20;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, serviceKey!);

    console.log(`발행 시작: ${limit}개 콘텐츠 (검증된 데이터만)`);

    const { data: combinations, error: combError } = await supabase
      .from('longtail_combinations')
      .select('*')
      .eq('is_published', false)
      .eq('data_verified', true)
      .eq('status', 'verified')
      .order('search_volume', { ascending: false })
      .limit(limit);

    if (combError) {
      console.error('Query error:', combError);
      await sendAlert(
        supabase,
        '🚨 [bustime.site] 콘텐츠 발행 실패',
        `콘텐츠 조회 실패\n\n오류: ${combError.message}\n시간: ${new Date().toLocaleString('ko-KR')}`,
      );
      throw combError;
    }

    if (!combinations || combinations.length === 0) {
      const message = '발행할 검증된 조합이 없습니다. 먼저 verify-transport-data 함수를 실행하세요.';
      console.warn(message);
      
      await sendAlert(
        supabase,
        '⚠️ [bustime.site] 검증된 콘텐츠 없음',
        `${message}\n\n검증되지 않은 조합 수를 확인하고 데이터 검증을 먼저 실행하세요.\n\n시간: ${new Date().toLocaleString('ko-KR')}`,
      );
      
      return new Response(
        JSON.stringify({ success: true, published: 0, message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`${combinations.length}개의 검증된 조합을 발행합니다`);

    const published = [];
    const errors = [];

    for (const combination of combinations) {
      try {
        await supabase
          .from('longtail_combinations')
          .update({ status: 'generating' })
          .eq('id', combination.id);

        const [serviceRes, locationRes, actionRes] = await Promise.all([
          supabase.from('services').select('*').eq('id', combination.service_id).maybeSingle(),
          supabase.from('keyword_locations').select('*').eq('id', combination.location_id).maybeSingle(),
          supabase.from('keyword_actions').select('*').eq('id', combination.action_id).maybeSingle(),
        ]);

        const service = serviceRes.data;
        const location = locationRes.data;
        const action = actionRes.data;

        if (!service || !location || !action) {
          console.log(`데이터 부족: ${combination.id}`);
          await supabase
            .from('longtail_combinations')
            .update({ status: 'failed' })
            .eq('id', combination.id);
          continue;
        }

        const slug = combination.generated_slug || 
          `${location.name}-${service.name}-${service.service_number || ''}-${action.action}`
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-한글]/gi, '');

        const { data: existingPage } = await supabase
          .from('longtail_content_pages')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (existingPage) {
          console.log(`중복 slug 건너뛜: ${slug}`);
          await supabase
            .from('longtail_combinations')
            .update({ is_published: true, status: 'published', published_at: new Date().toISOString() })
            .eq('id', combination.id);
          continue;
        }

        const serviceNumber = service.service_number || '';
        const title = `${location.name} ${service.name}${serviceNumber ? ' ' + serviceNumber : ''} ${action.action}`;
        const description = `${location.name}에서 ${service.name}${serviceNumber ? ' ' + serviceNumber : ''}을 이용하실 때 필요한 ${action.action} 정보를 제공합니다. 실시간 운행 정보를 확인하세요.`;

        const content = `
# ${title}

${description}

## 기본 정보

- **서비스명**: ${service.name}
${serviceNumber ? `- **노선번호**: ${serviceNumber}\n` : ''}
- **위치**: ${location.name}
- **운행 상태**: 정상 운행

## 상세 정보

${service.description || '자세한 내용은 공식 앱이나 웹사이트를 통해 확인하세요.'}

## 이용 방법

1. 실시간 정보를 확인하세요
2. ${action.action} 정보를 참고하세요
3. 현장 상황에 따라 변동될 수 있습니다

## 주의사항

- 실제 운행 정보는 현장 상황에 따라 달라질 수 있습니다
- 최신 정보는 공식 앱을 통해 확인하세요
- 이 정보는 공공 API를 통해 검증된 데이터입니다
        `.trim();

        const { error: pageError } = await supabase
          .from('longtail_content_pages')
          .insert({
            title,
            slug,
            meta_description: description,
            content,
            keywords: [location.name, service.name, serviceNumber, action.action].filter(Boolean),
            service_id: service.id,
            location_id: location.id,
            is_published: true,
            published_at: new Date().toISOString(),
          });

        if (pageError) {
          console.error(`페이지 삽입 오류: ${combination.id}`, pageError);
          errors.push({ combination_id: combination.id, error: pageError.message });
          
          await supabase
            .from('longtail_combinations')
            .update({ status: 'failed' })
            .eq('id', combination.id);
          continue;
        }

        const { error: updateError } = await supabase
          .from('longtail_combinations')
          .update({
            is_published: true,
            status: 'published',
            published_at: new Date().toISOString(),
          })
          .eq('id', combination.id);

        if (updateError) {
          console.error(`상태 업데이트 오류: ${combination.id}`, updateError);
        }

        published.push({
          id: combination.id,
          title,
          slug,
        });

        console.log(`발행 성공: ${title}`);

      } catch (error) {
        console.error(`조합 ${combination.id} 발행 실패:`, error);
        errors.push({ combination_id: combination.id, error: error.message });
        
        await supabase
          .from('longtail_combinations')
          .update({ status: 'failed' })
          .eq('id', combination.id);
      }
    }

    console.log(`총 ${published.length}개 발행 완료 (${errors.length}개 실패)`);

    if (published.length === 0 && combinations.length > 0) {
      await sendAlert(
        supabase,
        '🚨 [bustime.site] 콘텐츠 발행 실패',
        `모든 콘텐츠 발행에 실패했습니다.\n\n시도한 조합: ${combinations.length}개\n오류: ${errors.length}개\n\n세부사항:\n${JSON.stringify(errors.slice(0, 5), null, 2)}\n\n시간: ${new Date().toLocaleString('ko-KR')}`,
      );
    } else if (published.length < limit * 0.3) {
      await sendAlert(
        supabase,
        '⚠️ [bustime.site] 콘텐츠 발행률 저하',
        `예상보다 적은 콘텐츠가 발행되었습니다.\n\n발행: ${published.length}개 / 목표: ${limit}개\n실패: ${errors.length}개\n\n시간: ${new Date().toLocaleString('ko-KR')}`,
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        published: published.length,
        items: published,
        errors: errors.length > 0 ? errors : undefined,
        message: `${published.length}개의 팔트 기반 콘텐츠가 발행되었습니다.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fatal error:', error);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);
    
    await sendAlert(
      supabase,
      '💥 [bustime.site] 치명적 오류',
      `publish-longtail-content 함수에서 치명적 오류 발생\n\n오류: ${error.message}\n스택:\n${error.stack}\n\n시간: ${new Date().toLocaleString('ko-KR')}`,
    );
    
    return new Response(
      JSON.stringify({ success: false, published: 0, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});