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
          usage: '/fetch-bus-location?busNumber=6001'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`버스 ${busNumber}번 실시간 위치 조회 중...`);

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

    const locationUrl = `http://ws.bus.go.kr/api/rest/buspos/getBusPosByRtid?serviceKey=${apiKey}&busRouteId=${busRouteId}&resultType=json`;
    const locationResponse = await fetch(locationUrl);
    const locationData = await locationResponse.json();

    if (!locationData.msgBody?.itemList) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '현재 운행 중인 버스가 없습니다'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const locations = locationData.msgBody.itemList;
    console.log(`${locations.length}대 버스 위치 발견`);

    await supabase
      .from('bus_locations')
      .delete()
      .eq('bus_route_id', busRouteId);

    const locationRecords = locations.map((loc: any) => ({
      bus_route_id: busRouteId,
      bus_number: busNumber,
      vehicle_number: loc.vehId,
      latitude: parseFloat(loc.gpsY) || null,
      longitude: parseFloat(loc.gpsX) || null,
      stop_sequence: parseInt(loc.sectOrd) || 0,
      last_stop_id: loc.stId
    }));

    if (locationRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('bus_locations')
        .insert(locationRecords);

      if (insertError) {
        console.error('위치 정보 저장 실패:', insertError);
        throw insertError;
      }
    }

    console.log(`${locationRecords.length}대 버스 위치 저장 완료`);

    return new Response(
      JSON.stringify({
        success: true,
        busNumber,
        busRouteId,
        totalBuses: locations.length,
        locations: locations.map((loc: any) => ({
          vehicleNumber: loc.vehId,
          latitude: loc.gpsY,
          longitude: loc.gpsX,
          stopSequence: loc.sectOrd,
          lastStopId: loc.stId,
          updatedAt: loc.tmX
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