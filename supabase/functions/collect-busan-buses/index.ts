import { createClient } from 'npm:@supabase/supabase-js@2';
import { TRANSPORT_SOURCES } from '../_shared/transportDataSources.ts';
import {
  buildApiUrl,
  logApiCall,
  parseXml,
  getXmlText,
  saveRawResponse,
  logAutomation,
  getTrafficCategory,
  batchUpsertServices,
  CORS_HEADERS,
  errorResponse,
  successResponse,
} from '../_shared/apiHelpers.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const source = TRANSPORT_SOURCES.busan_bus;

    console.log(`${source.description} 수집 시작...`);

    const url = buildApiUrl(source, {
      pageNo: '1',
      numOfRows: '100',
    });

    logApiCall(url);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log('XML 응답 길이:', xmlText.length);

    await saveRawResponse(supabase, source, xmlText);

    const xmlDoc = parseXml(xmlText);
    const items = xmlDoc.querySelectorAll('item');
    console.log(`${items.length}개 노선 발견`);

    if (items.length === 0) {
      console.warn('응답 구조:', xmlText.substring(0, 500));
    }

    const category = await getTrafficCategory(supabase);

    const collectedRoutes: any[] = [];

    for (const item of items) {
      try {
        const lineno = getXmlText(item, 'lineno');
        const buslineId = getXmlText(item, 'buslineId') || lineno;
        const lineNm = getXmlText(item, 'lineNm', lineno);
        const startpoint = getXmlText(item, 'startpoint', '출발지');
        const endpoint = getXmlText(item, 'endpoint', '도착지');
        const startTime = getXmlText(item, 'startTime', '05:00');
        const endTime = getXmlText(item, 'endTime', '23:30');
        const term = getXmlText(item, 'term', '10');

        if (!lineno) continue;

        const service = {
          category_id: category.id,
          name: `부산 ${lineno}번 버스`,
          service_number: lineno,
          description: `${startpoint}에서 ${endpoint}까지 운행하는 부산 시내버스`,
          address: '부산광역시',
          operating_hours: `첫차 ${startTime} / 막차 ${endTime}`,
          phone: '051-120',
          website_url: 'https://www.busan.go.kr',
          long_description: `부산 ${lineno}번 버스는 ${startpoint}에서 ${endpoint}까지 운행합니다. 배차 간격은 평균 ${term}분입니다.`,
          seo_keywords: ['부산', lineno, '버스', '시간표', '노선도'],
          is_active: true,
        };

        collectedRoutes.push(service);
      } catch (error) {
        console.error('노선 처리 실패:', error.message);
      }
    }

    const totalSaved = await batchUpsertServices(supabase, collectedRoutes);

    await logAutomation(
      supabase,
      'collect-busan-buses',
      'success',
      `부산 버스 ${totalSaved}개 노선 수집 완료`,
      { collected: totalSaved, source: source.key }
    );

    console.log(`총 ${totalSaved}개 노선 수집 완료`);

    return successResponse({
      collected: totalSaved,
      message: `${source.region} 버스 ${totalSaved}개 노선 수집 완료`,
    });
  } catch (error) {
    console.error('Error:', error);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await logAutomation(supabase, 'collect-busan-buses', 'failed', error.message, {
      error: error.stack,
    });

    return errorResponse(error);
  }
});
