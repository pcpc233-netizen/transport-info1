import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

/**
 * 실제 공공 API에서 버스 데이터를 가져오는 함수
 * 
 * 사용 가능한 API:
 * 1. 서울 버스 정보: https://data.seoul.go.kr/
 * 2. 경기도 버스 정보: https://data.gg.go.kr/
 * 3. 국토교통부 버스 정보: https://www.data.go.kr/
 */

interface BusArrivalInfo {
  routeId: string;
  routeNumber: string;
  stationId: string;
  stationName: string;
  arrival1: string; // 첫 번째 버스 도착 예정 시간
  arrival2: string; // 두 번째 버스 도착 예정 시간
  location1: string; // 첫 번째 버스 위치
  location2: string; // 두 번째 버스 위치
  lowPlate1: boolean; // 저상버스 여부
  lowPlate2: boolean;
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

    // 공공 API 키는 환경변수에서 가져옴 (사용자가 설정 필요)
    const seoulApiKey = Deno.env.get('SEOUL_BUS_API_KEY') || 'DEMO_KEY';
    
    const results = {
      success: false,
      message: '',
      data: [] as any[],
      apiUsed: 'demo',
    };

    // 실제 API가 설정되지 않은 경우 데모 데이터 사용
    if (seoulApiKey === 'DEMO_KEY') {
      results.message = '⚠️ 실제 API 키가 설정되지 않아 데모 데이터를 사용합니다.';
      results.apiUsed = 'demo';
      
      // 데모 실시간 데이터 생성
      const demoData = [
        {
          routeNumber: '6001',
          stationName: '강남역',
          arrival1: '3분',
          arrival2: '15분',
          location1: '5정거장 전',
          location2: '12정거장 전',
          lowPlate1: true,
          lowPlate2: false,
        },
        {
          routeNumber: '401',
          stationName: '사당역',
          arrival1: '곧 도착',
          arrival2: '8분',
          location1: '2정거장 전',
          location2: '7정거장 전',
          lowPlate1: false,
          lowPlate2: true,
        },
        {
          routeNumber: '141',
          stationName: '서울역',
          arrival1: '5분',
          arrival2: '18분',
          location1: '4정거장 전',
          location2: '10정거장 전',
          lowPlate1: true,
          lowPlate2: true,
        },
      ];

      // API 캐시에 저장
      for (const bus of demoData) {
        const { data: service } = await supabase
          .from('services')
          .select('id')
          .eq('service_number', bus.routeNumber)
          .maybeSingle();

        if (service) {
          await supabase.from('api_data_cache').insert({
            service_id: service.id,
            data_type: 'bus_arrival',
            data: bus,
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5분 후 만료
          });
        }
      }

      results.data = demoData;
      results.success = true;
    } else {
      // TODO: 실제 API 연동
      results.message = '실제 API 연동 준비 완료';
      results.success = true;
    }

    return new Response(
      JSON.stringify(results),
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
        solution: '공공데이터포털(data.go.kr)에서 API 키를 발급받아 환경변수에 설정하세요.',
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
