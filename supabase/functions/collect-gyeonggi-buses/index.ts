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

    const source = TRANSPORT_SOURCES.gyeonggi_bus_route;

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
        const routeId = getXmlText(item, 'routeId');
        const routeName = getXmlText(item, 'routeName');
        const routeTypeName = getXmlText(item, 'routeTypeName', '일반');
        const startStation = getXmlText(item, 'startStationName', '출발지');
        const endStation = getXmlText(item, 'endStationName', '도착지');
        const firstTime = getXmlText(item, 'upFirstTime', '05:00');
        const lastTime = getXmlText(item, 'upLastTime', '23:30');
        const peakAlloc = getXmlText(item, 'peakAlloc', '10');

        if (!routeName) continue;

        const service = {
          category_id: category.id,
          name: `경기 ${routeName}번 버스`,
          service_number: routeName,
          description: `${startStation}에서 ${endStation}까지 운행하는 경기도 ${routeTypeName}버스`,
          address: '경기도',
          operating_hours: `첫차 ${firstTime} / 막차 ${lastTime}`,
          phone: '031-120',
          website_url: 'https://www.gg.go.kr',
          long_description: `경기도 ${routeName}번 ${routeTypeName}버스는 ${startStation}에서 ${endStation}까지 운행합니다. 배차 간격은 평균 ${peakAlloc}분입니다.`,
          seo_keywords: ['경기도', routeName, '버스', '시간표', '노선도', routeTypeName],
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
      'collect-gyeonggi-buses',
      'success',
      `경기도 버스 ${totalSaved}개 노선 수집 완료`,
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

    await logAutomation(supabase, 'collect-gyeonggi-buses', 'failed', error.message, {
      error: error.stack,
    });

    return errorResponse(error);
  }
});
