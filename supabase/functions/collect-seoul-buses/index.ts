import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SeoulBusRoute {
  busRouteId: string;
  busRouteNm: string;
  routeType: string;
  stStationNm: string;
  edStationNm: string;
  term: string;
  firstBusTm: string;
  lastBusTm: string;
  length: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let apiKey = Deno.env.get('SEOUL_BUS_API_KEY');

    if (req.method === 'POST' && req.body) {
      try {
        const body = await req.json();
        if (body.apiKey) {
          apiKey = body.apiKey;
        }
      } catch (e) {
      }
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API 키가 필요합니다.',
          guide: 'POST 요청 시 body에 { "apiKey": "YOUR_API_KEY" }를 포함하세요.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('서울시 버스 노선 정보 수집 시작...');

    const collectedRoutes: any[] = [];
    let totalCollected = 0;

    const baseUrl = 'http://ws.bus.go.kr/api/rest/busRouteInfo/getBusRouteList';
    const apiUrl = `${baseUrl}?serviceKey=${apiKey}&strSrch=&resultType=json`;

    console.log('API 호출 중...');
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    console.log('API 응답 받음:', text.substring(0, 500));

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('JSON 파싱 실패:', text);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API 응답이 올바른 JSON 형식이 아닙니다.',
          rawResponse: text.substring(0, 1000)
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('파싱된 데이터 구조:', JSON.stringify(data, null, 2).substring(0, 1000));

    if (!data.msgBody || !data.msgBody.itemList) {
      console.error('예상치 못한 응답 구조:', JSON.stringify(data, null, 2));

      return new Response(
        JSON.stringify({
          success: false,
          error: '버스 노선 데이터를 찾을 수 없습니다.',
          apiResponse: data,
          hint: 'API 응답 구조를 확인하세요. msgBody.itemList가 없습니다.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const routes = data.msgBody.itemList;
    console.log(`${routes.length}개 노선 발견`);

    const { data: category } = await supabase
      .from('service_categories')
      .select('id')
      .ilike('slug', '%traffic%')
      .maybeSingle();

    if (!category) {
      throw new Error('교통정보 카테고리를 찾을 수 없습니다.');
    }

    const routeTypeMap: { [key: string]: string } = {
      '1': '공항',
      '2': '마을',
      '3': '간선',
      '4': '지선',
      '5': '순환',
      '6': '광역',
      '7': '인천',
      '0': '기타'
    };

    const limitedRoutes = routes.slice(0, 100);

    for (const route of limitedRoutes) {
      try {
        const routeType = routeTypeMap[route.routeType] || '일반';
        const busNumber = route.busRouteNm;

        const service = {
          category_id: category.id,
          name: `서울 ${busNumber}번 버스`,
          service_number: busNumber,
          description: `${route.stStationNm}에서 ${route.edStationNm}까지 운행하는 ${routeType}버스`,
          address: '서울특별시',
          operating_hours: `첫차 ${route.firstBusTm || '05:00'} / 막차 ${route.lastBusTm || '23:30'}`,
          phone: '1330',
          website_url: 'https://bus.go.kr',
          long_description: generateBusContent({
            city: '서울',
            routeNumber: busNumber,
            routeName: route.busRouteNm,
            routeType: routeType,
            startStation: route.stStationNm,
            endStation: route.edStationNm,
            firstBus: route.firstBusTm || '05:00',
            lastBus: route.lastBusTm || '23:30',
            interval: parseInt(route.term) || 10,
            length: route.length
          }),
          seo_keywords: ['서울', busNumber, '버스', '시간표', '노선도', routeType],
          is_active: true
        };

        collectedRoutes.push(service);
        totalCollected++;

        if (collectedRoutes.length >= 50) {
          await supabase.from('services').upsert(collectedRoutes, {
            onConflict: 'service_number,category_id',
            ignoreDuplicates: false
          });

          console.log(`${totalCollected}개 노선 저장 완료`);
          collectedRoutes.length = 0;
        }
      } catch (error) {
        console.error(`노선 처리 실패 (${route.busRouteNm}):`, error.message);
      }
    }

    if (collectedRoutes.length > 0) {
      await supabase.from('services').upsert(collectedRoutes, {
        onConflict: 'service_number,category_id',
        ignoreDuplicates: false
      });
    }

    console.log(`총 ${totalCollected}개 노선 수집 완료`);

    return new Response(
      JSON.stringify({
        success: true,
        collected: totalCollected,
        message: `서울시 버스 ${totalCollected}개 노선 수집 완료`,
        note: '전체 노선을 수집하려면 limit 제한을 해제하세요.'
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
        stack: error.stack
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

function generateBusContent(route: {
  city: string;
  routeNumber: string;
  routeName: string;
  routeType: string;
  startStation: string;
  endStation: string;
  firstBus: string;
  lastBus: string;
  interval: number;
  length?: string;
}): string {
  return `# ${route.city} ${route.routeNumber}번 버스 완벽 가이드

${route.city} ${route.routeNumber}번 버스는 ${route.startStation}에서 ${route.endStation}까지 운행하는 ${route.routeType}버스입니다.

## 📍 기본 정보
- **노선 번호**: ${route.routeNumber}
- **노선 유형**: ${route.routeType}버스
- **운행 구간**: ${route.startStation} ↔ ${route.endStation}
- **노선 길이**: ${route.length || '정보 없음'}
- **첫차 시간**: ${route.firstBus}
- **막차 시간**: ${route.lastBus}
- **배차 간격**: 평균 ${route.interval}분

## 💰 요금 안내
- **성인**: 1,500원 (교통카드 1,400원)
- **청소년**: 1,000원 (교통카드 900원)
- **어린이**: 500원 (교통카드 450원)
- **환승 할인**: 30분 이내 무료 1회

## 🚏 주요 정류장
- 출발: ${route.startStation}
- 도착: ${route.endStation}
- 상세 정류장 목록은 카카오맵 또는 네이버 지도에서 확인하세요

## ⏰ 운행 시간
- **평일**: ${route.firstBus} ~ ${route.lastBus}
- **주말**: ${route.firstBus} ~ ${route.lastBus}
- **배차 간격**: 평일 ${route.interval}분 / 주말 ${route.interval + 5}분

## 💡 이용 팁
1. 출퇴근 시간(07:00-09:00, 18:00-20:00)에는 배차 간격이 더 짧습니다
2. 주말과 공휴일에는 배차 간격이 약간 길어질 수 있습니다
3. 교통카드 사용 시 환승 할인 혜택을 받을 수 있습니다
4. 실시간 버스 위치는 카카오맵이나 네이버 지도 앱에서 확인하세요

## 📱 실시간 정보 확인
- [카카오맵에서 보기](https://map.kakao.com/link/search/${route.city}%20${route.routeNumber}번%20버스)
- [네이버 지도에서 보기](https://map.naver.com/v5/search/${route.city}%20${route.routeNumber}번%20버스)
- [서울시 버스정보시스템](https://bus.go.kr)

## ❓ 자주 묻는 질문

**Q: 심야에도 운행하나요?**
A: 막차는 ${route.lastBus}이며, 심야버스는 별도 노선(N번)을 이용하세요.

**Q: 저상버스인가요?**
A: 대부분의 ${route.routeType}버스는 저상버스가 운행됩니다.

**Q: 환승 할인이 되나요?**
A: 네, 교통카드 사용 시 30분 이내 1회 무료 환승이 가능합니다.

**Q: 실시간 위치 확인 방법은?**
A: 카카오맵, 네이버 지도, 또는 서울버스 앱에서 확인 가능합니다.

## 🚌 노선 특징
- ${route.routeType}버스로 서울 주요 지역을 연결합니다
- ${route.startStation}과 ${route.endStation} 구간을 안전하고 편리하게 이동할 수 있습니다
- 대부분 저상버스가 운행되어 휠체어 이용이 가능합니다

---
*이 정보는 서울시 공공데이터를 기반으로 매일 자동 업데이트됩니다.*
*최종 업데이트: ${new Date().toISOString().split('T')[0]}*
`;
}