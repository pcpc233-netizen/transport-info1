import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const url = new URL(req.url);
    const apiKey = Deno.env.get('SEOUL_BUS_API_KEY');
    const stopId = url.searchParams.get('stopId');

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'SEOUL_BUS_API_KEY 환경변수가 설정되지 않았습니다',
          message: 'Supabase 대시보드에서 Edge Function Secrets를 설정해주세요'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!stopId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '정류소 ID를 입력해주세요',
          usage: '/fetch-bus-arrivals?stopId=100000001'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`정류소 ${stopId} 버스 도착 정보 조회 중...`);

    const { data: stopData, error: stopError } = await supabase
      .from('bus_stops')
      .select('ars_id, stop_name')
      .eq('stop_id', stopId)
      .maybeSingle();

    if (stopError || !stopData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '정류소를 찾을 수 없습니다',
          stopId
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const arsId = stopData.ars_id;
    if (!arsId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '이 정류소의 ARS ID가 없습니다. 먼저 fetch-bus-stops를 호출해주세요.',
          stopId,
          stopName: stopData.stop_name
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`ARS ID: ${arsId}, Stop ID: ${stopId}`);

    let data: any = null;
    let apiUrl = '';

    if (arsId) {
      apiUrl = `http://ws.bus.go.kr/api/rest/stationinfo/getStationByUid?serviceKey=${apiKey}&arsId=${arsId}&resultType=json`;
      console.log('ARS ID로 API 호출:', apiUrl);

      const response = await fetch(apiUrl);
      data = await response.json();
      console.log('ARS API 응답:', JSON.stringify(data, null, 2));
    }

    if (!data?.msgBody?.itemList && stopId) {
      apiUrl = `http://ws.bus.go.kr/api/rest/stationinfo/getStationByUid?serviceKey=${apiKey}&arsId=${stopId}&resultType=json`;
      console.log('Stop ID로 API 재시도:', apiUrl);

      const response = await fetch(apiUrl);
      data = await response.json();
      console.log('Stop ID API 응답:', JSON.stringify(data, null, 2));
    }

    if (!data?.msgBody?.itemList) {
      const errorMsg = data?.msgHeader?.headerMsg || '도착 정보를 가져올 수 없습니다';
      console.error('API 오류:', errorMsg);

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMsg,
          stopId,
          arsId,
          apiResponse: data,
          attempts: [
            { type: 'arsId', value: arsId },
            { type: 'stopId', value: stopId }
          ]
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const arrivals = data.msgBody.itemList;
    console.log(`${arrivals.length}개 버스 도착 정보 발견`);

    await supabase
      .from('bus_arrivals')
      .delete()
      .eq('stop_id', stopId);

    const arrivalRecords = arrivals.map((arrival: any) => ({
      stop_id: stopId,
      bus_number: arrival.rtNm,
      bus_route_id: arrival.busRouteId,
      arrival_time: parseInt(arrival.traTime1) || 0,
      remaining_stops: parseInt(arrival.stOrd1) || 0,
      vehicle_number: arrival.vehId1 || null,
      is_full: arrival.congestion1 === '3'
    }));

    if (arrivalRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('bus_arrivals')
        .insert(arrivalRecords);

      if (insertError) {
        console.error('도착 정보 저장 실패:', insertError);
        throw insertError;
      }
    }

    console.log(`${arrivalRecords.length}개 도착 정보 저장 완료`);

    return new Response(
      JSON.stringify({
        success: true,
        stopId,
        arsId,
        totalArrivals: arrivals.length,
        arrivals: arrivals.map((arrival: any) => ({
          busNumber: arrival.rtNm,
          busType: arrival.routeType,
          arrivalTime: arrival.traTime1,
          remainingStops: arrival.stOrd1,
          isFull: arrival.congestion1 === '3',
          message: `${arrival.arrmsg1}`
        }))
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
        error: error.message
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