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
    const busNumber = url.searchParams.get('busNumber');

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'SEOUL_BUS_API_KEY 환경변수가 설정되지 않았습니다'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!busNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '버스 번호를 입력해주세요',
          usage: '/fetch-bus-stops?busNumber=6001'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`버스 ${busNumber}번 정류소 정보 조회 중...`);

    const routeUrl = `http://ws.bus.go.kr/api/rest/busRouteInfo/getBusRouteList?serviceKey=${apiKey}&strSrch=${busNumber}&resultType=json`;
    const routeResponse = await fetch(routeUrl);
    const routeData = await routeResponse.json();

    if (!routeData.msgBody?.itemList || routeData.msgBody.itemList.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `버스 ${busNumber}번을 찾을 수 없습니다`
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const busRouteId = routeData.msgBody.itemList[0].busRouteId;
    console.log(`버스 노선 ID: ${busRouteId}`);

    const stopsUrl = `http://ws.bus.go.kr/api/rest/busRouteInfo/getStaionByRoute?serviceKey=${apiKey}&busRouteId=${busRouteId}&resultType=json`;
    const stopsResponse = await fetch(stopsUrl);
    const stopsData = await stopsResponse.json();

    if (!stopsData.msgBody?.itemList) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '정류소 정보를 가져올 수 없습니다'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const stops = stopsData.msgBody.itemList;
    console.log(`${stops.length}개 정류소 발견`);

    const stopRecords = stops.map((stop: any) => ({
      stop_id: stop.station,
      ars_id: stop.arsId || null,
      stop_name: stop.stationNm,
      latitude: parseFloat(stop.gpsY) || null,
      longitude: parseFloat(stop.gpsX) || null,
      district: stop.districtCd || null
    }));

    const { error: upsertError } = await supabase
      .from('bus_stops')
      .upsert(stopRecords, {
        onConflict: 'stop_id',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('정류소 저장 실패:', upsertError);
      throw upsertError;
    }

    console.log(`${stops.length}개 정류소 저장 완료`);

    return new Response(
      JSON.stringify({
        success: true,
        busNumber,
        busRouteId,
        totalStops: stops.length,
        stops: stops.map((stop: any) => ({
          stopId: stop.station,
          arsId: stop.arsId,
          stopName: stop.stationNm,
          sequence: stop.seq,
          latitude: stop.gpsY,
          longitude: stop.gpsX
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