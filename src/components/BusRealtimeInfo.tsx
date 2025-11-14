import { useState, useEffect } from 'react';
import { MapPin, Clock, Bus, RefreshCw, Navigation2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BusRealtimeInfoProps {
  busNumber: string;
}

interface BusStop {
  stop_id: string;
  stop_name: string;
  latitude: number;
  longitude: number;
  district: string;
}

interface BusArrival {
  stop_id: string;
  bus_number: string;
  arrival_time: number;
  remaining_stops: number;
  vehicle_number: string;
  is_full: boolean;
  updated_at: string;
}

interface BusLocation {
  vehicle_number: string;
  latitude: number;
  longitude: number;
  stop_sequence: number;
  last_stop_id: string;
  updated_at: string;
  bus_stops?: {
    stop_name: string;
  };
}

interface StopWithArrival extends BusStop {
  arrival?: BusArrival;
  sequence?: number;
}

export default function BusRealtimeInfo({ busNumber }: BusRealtimeInfoProps) {
  const [stops, setStops] = useState<StopWithArrival[]>([]);
  const [selectedStop, setSelectedStop] = useState<StopWithArrival | null>(null);
  const [locations, setLocations] = useState<BusLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingArrival, setLoadingArrival] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    loadBusRoute();
    loadBusLocations();
  }, [busNumber]);

  const loadBusRoute = async () => {
    setLoading(true);
    try {
      const API_KEY = 'da6a1b3be689e14556c3240efefa1e49cac3f2fb6b19571adb4b58afffc6aa14';

      const routeUrl = `/api/bus/busRouteInfo/getBusRouteList?serviceKey=${API_KEY}&strSrch=${busNumber}&resultType=json`;
      const routeResponse = await fetch(routeUrl);
      const routeData = await routeResponse.json();

      if (!routeData.msgBody?.itemList || routeData.msgBody.itemList.length === 0) {
        console.error(`버스 ${busNumber}번을 찾을 수 없습니다`);
        return;
      }

      const busRouteId = routeData.msgBody.itemList[0].busRouteId;

      const stopsUrl = `/api/bus/busRouteInfo/getStaionByRoute?serviceKey=${API_KEY}&busRouteId=${busRouteId}&resultType=json`;
      const stopsResponse = await fetch(stopsUrl);
      const stopsData = await stopsResponse.json();

      if (stopsData.msgBody?.itemList) {
        const stopsWithSequence = stopsData.msgBody.itemList.map((stop: any, idx: number) => ({
          stop_id: stop.station,
          stop_name: stop.stationNm,
          latitude: parseFloat(stop.gpsY) || 0,
          longitude: parseFloat(stop.gpsX) || 0,
          district: stop.districtCd,
          sequence: stop.seq || (idx + 1),
          ars_id: stop.arsId
        }));
        setStops(stopsWithSequence);

        const stopRecords = stopsWithSequence.map((stop: any) => ({
          stop_id: stop.stop_id,
          ars_id: stop.ars_id || null,
          stop_name: stop.stop_name,
          latitude: stop.latitude,
          longitude: stop.longitude,
          district: stop.district
        }));

        await supabase.from('bus_stops').upsert(stopRecords, {
          onConflict: 'stop_id',
          ignoreDuplicates: false
        });
      }
    } catch (err) {
      console.error('노선 정보 로딩 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBusLocations = async () => {
    try {
      const API_KEY = 'da6a1b3be689e14556c3240efefa1e49cac3f2fb6b19571adb4b58afffc6aa14';

      const routeUrl = `/api/bus/busRouteInfo/getBusRouteList?serviceKey=${API_KEY}&strSrch=${busNumber}&resultType=json`;
      const routeResponse = await fetch(routeUrl);
      const routeData = await routeResponse.json();

      if (!routeData.msgBody?.itemList || routeData.msgBody.itemList.length === 0) {
        return;
      }

      const busRouteId = routeData.msgBody.itemList[0].busRouteId;

      const locationUrl = `/api/bus/buspos/getBusPosByRtid?serviceKey=${API_KEY}&busRouteId=${busRouteId}&resultType=json`;
      const locationResponse = await fetch(locationUrl);
      const locationData = await locationResponse.json();

      if (locationData.msgBody?.itemList) {
        const enrichedLocations = await Promise.all(
          locationData.msgBody.itemList.map(async (loc: any) => {
            const { data: stopData } = await supabase
              .from('bus_stops')
              .select('stop_name')
              .eq('stop_id', loc.stId)
              .maybeSingle();

            return {
              vehicle_number: loc.vehId,
              latitude: parseFloat(loc.gpsY),
              longitude: parseFloat(loc.gpsX),
              stop_sequence: parseInt(loc.sectOrd) || 0,
              last_stop_id: loc.stId,
              updated_at: loc.tmX,
              bus_stops: stopData ? { stop_name: stopData.stop_name } : null
            };
          })
        );

        setLocations(enrichedLocations);
      }
    } catch (error) {
      console.error('버스 위치 로딩 실패:', error);
    }
  };

  const loadStopArrival = async (stop: StopWithArrival) => {
    setLoadingArrival(true);
    setSelectedStop({ ...stop });

    try {
      const API_KEY = 'da6a1b3be689e14556c3240efefa1e49cac3f2fb6b19571adb4b58afffc6aa14';
      const arsId = (stop as any).ars_id || stop.stop_id;

      const arrivalUrl = `/api/bus/stationinfo/getStationByUid?serviceKey=${API_KEY}&arsId=${arsId}&resultType=json`;
      const arrivalResponse = await fetch(arrivalUrl);
      const arrivalData = await arrivalResponse.json();

      if (arrivalData.msgBody?.itemList) {
        const busArrival = arrivalData.msgBody.itemList.find((arr: any) => arr.rtNm === busNumber);

        if (busArrival) {
          const arrivalRecord = {
            stop_id: stop.stop_id,
            bus_number: busNumber,
            arrival_time: parseInt(busArrival.traTime1) || 0,
            remaining_stops: parseInt(busArrival.stOrd1) || 0,
            is_full: busArrival.congestion1 === '3',
            vehicle_number: busArrival.vehId1 || null,
            bus_route_id: busArrival.busRouteId
          };

          setSelectedStop({
            ...stop,
            arrival: arrivalRecord
          });
          setLastUpdate(new Date());
        } else {
          setSelectedStop({
            ...stop,
            arrival: undefined
          });
        }
      } else {
        setSelectedStop({
          ...stop,
          arrival: undefined
        });
      }
    } catch (err) {
      console.error('도착 정보 로딩 실패:', err);
      setSelectedStop({
        ...stop,
        arrival: undefined
      });
    } finally {
      setLoadingArrival(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 1) return '곧 도착';
    if (minutes < 60) return `${minutes}분 후`;
    const hours = Math.floor(minutes / 60);
    return `${hours}시간 ${minutes % 60}분 후`;
  };

  const getArrivalColor = (minutes: number) => {
    if (minutes < 3) return 'text-red-600 bg-red-50 border-red-300';
    if (minutes < 10) return 'text-orange-600 bg-orange-50 border-orange-300';
    return 'text-blue-600 bg-blue-50 border-blue-300';
  };

  return (
    <div className="space-y-4">
      {locations.length > 0 && (
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Navigation2 className="text-green-600" size={20} />
            <h3 className="font-bold text-green-900 text-sm md:text-base">현재 {locations.length}대 운행 중</h3>
          </div>
          <p className="text-xs md:text-sm text-gray-700">실시간으로 운행 중인 버스가 {locations.length}대 있습니다</p>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="text-blue-600" size={20} />
          <h3 className="text-base md:text-lg font-bold text-gray-900">버스 정류장 목록</h3>
        </div>
        <p className="text-xs md:text-sm text-gray-600 mb-4">정류장을 클릭하면 실시간 도착 정보를 확인할 수 있습니다</p>

        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm">노선 정보를 불러오는 중...</p>
          </div>
        ) : stops.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {stops.map((stop, idx) => {
                  const busAtStop = locations.find(loc => loc.last_stop_id === stop.stop_id);
                  const isSelected = selectedStop?.stop_id === stop.stop_id;

                  return (
                    <button
                      key={stop.stop_id}
                      onClick={() => loadStopArrival(stop)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-blue-400 shadow-sm'
                          : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          busAtStop
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {stop.sequence}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm md:text-base flex items-center gap-2">
                            <span className="truncate">{stop.stop_name}</span>
                            {busAtStop && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full flex-shrink-0">
                                <Bus size={10} />
                              </span>
                            )}
                          </div>
                        </div>
                        <Clock className="text-gray-400 flex-shrink-0" size={16} />
                      </div>
                    </button>
                  );
            })}
          </div>
        ) : (
          <div className="py-8 text-center bg-gray-50 rounded-lg">
            <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 text-sm">노선 정보가 없습니다</p>
          </div>
        )}
      </div>

      {selectedStop && (
        <div className="bg-white rounded-lg border-2 border-blue-200 overflow-hidden shadow-md mt-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-bold text-white truncate">{selectedStop.stop_name}</h3>
                  </div>
                  <button
                    onClick={() => loadStopArrival(selectedStop)}
                    disabled={loadingArrival}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 font-semibold text-sm ml-2 flex-shrink-0"
                  >
                    <RefreshCw className={loadingArrival ? 'animate-spin' : ''} size={16} />
                    <span className="hidden md:inline">새로고침</span>
                  </button>
            </div>
          </div>

          {loadingArrival ? (
            <div className="px-4 py-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">실시간 정보를 불러오는 중...</p>
            </div>
          ) : selectedStop.arrival ? (
            <div className="p-4 md:p-5">
                  <div className="text-center mb-4">
                    <div className={`inline-block text-2xl md:text-3xl font-bold px-6 py-3 rounded-xl border-2 ${getArrivalColor(Math.floor(selectedStop.arrival.arrival_time / 60))}`}>
                      {formatTime(selectedStop.arrival.arrival_time)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">남은 정류장</div>
                      <div className="text-xl font-bold text-gray-900">
                        {selectedStop.arrival.remaining_stops}개
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">차량 상태</div>
                      <div className="text-base font-bold">
                        {selectedStop.arrival.is_full ? (
                          <span className="text-red-600">만차</span>
                        ) : (
                          <span className="text-green-600">여유</span>
                        )}
                      </div>
                    </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
                  <Clock size={40} className="mx-auto text-gray-300 mb-3" />
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    도착 정보 없음
                  </h3>
                  <p className="text-gray-600 text-sm">
                    현재 이 정류장으로 오는 버스가 없습니다
                  </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
