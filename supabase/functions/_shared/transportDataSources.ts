/**
 * 전국 교통 데이터 소스 통합 설정
 *
 * 모든 공공데이터포털 API는 단일 인증키를 사용하며,
 * 지역·기관별 API 서비스는 이 파일에서 중앙 관리됩니다.
 *
 * ⚠️ 사용 주의사항:
 * - 이 파일은 오직 Supabase Edge Functions에서만 사용됩니다
 * - 브라우저 번들에 포함되지 않도록 주의하세요
 * - 새로운 API 추가 시 이 파일만 수정하면 됩니다
 */

export type TransportCategory =
  | 'city_bus'           // 시내버스 노선정보
  | 'city_bus_pos'       // 시내버스 위치정보
  | 'express_bus'        // 고속버스 정보
  | 'express_bus_arrival'// 고속버스 도착정보
  | 'intercity_bus'      // 시외버스 정보
  | 'airport_bus'        // 공항버스 정보
  | 'train'              // 열차 정보
  | 'bus_lane';          // 버스전용차로 정보

export type TransportSourceKey =
  | 'incheon_bus_route'
  | 'incheon_bus_location'
  | 'gyeonggi_bus_route'
  | 'busan_bus'
  | 'daegu_bus'
  | 'gwangju_bis'
  | 'daejeon_bus'
  | 'ulsan_bis'
  | 'sejong_bus_lane'
  | 'chungju_bus'
  | 'tago_express_bus'
  | 'tago_express_arrival'
  | 'tago_intercity_bus'
  | 'kac_airport_bus'
  | 'incheon_airport_bus'
  | 'tago_train';

export interface TransportSourceConfig {
  key: TransportSourceKey;
  provider: string;
  region: string;
  category: TransportCategory;
  endpoint: string;
  responseFormat: 'xml' | 'json';
  defaultParams?: Record<string, string>;
  enabled: boolean;
  description?: string;
}

/**
 * 전국 교통 데이터 소스 설정
 *
 * 각 항목은 공공데이터포털 API 서비스 1개를 나타냅니다.
 * endpoint는 공공데이터포털에서 제공하는 실제 URL을 입력해야 합니다.
 */
export const TRANSPORT_SOURCES: Record<TransportSourceKey, TransportSourceConfig> = {
  incheon_bus_route: {
    key: 'incheon_bus_route',
    provider: '인천광역시',
    region: '인천광역시',
    category: 'city_bus',
    endpoint: 'http://apis.data.go.kr/6280000/busRouteService/getBusRouteInfoItem',
    responseFormat: 'xml',
    enabled: true,
    description: '인천광역시 버스노선 조회',
  },
  incheon_bus_location: {
    key: 'incheon_bus_location',
    provider: '인천광역시',
    region: '인천광역시',
    category: 'city_bus_pos',
    endpoint: 'http://apis.data.go.kr/6280000/busLocationService/getBusLocationList',
    responseFormat: 'xml',
    enabled: true,
    description: '인천광역시 버스위치정보 조회',
  },
  gyeonggi_bus_route: {
    key: 'gyeonggi_bus_route',
    provider: '경기도',
    region: '경기도',
    category: 'city_bus',
    endpoint: 'http://apis.data.go.kr/6410000/busrouteservice/getBusRouteInfoItem',
    responseFormat: 'xml',
    enabled: true,
    description: '경기도 버스노선 조회',
  },
  busan_bus: {
    key: 'busan_bus',
    provider: '부산광역시',
    region: '부산광역시',
    category: 'city_bus',
    endpoint: 'http://apis.data.go.kr/6260000/BusanBIMS/busInfo',
    responseFormat: 'xml',
    enabled: true,
    description: '부산광역시 부산버스정보시스템',
  },
  daegu_bus: {
    key: 'daegu_bus',
    provider: '대구광역시',
    region: '대구광역시',
    category: 'city_bus',
    endpoint: 'http://apis.data.go.kr/6270000/dgBusService/busRouteInfo',
    responseFormat: 'xml',
    enabled: true,
    description: '대구광역시 대구버스정보시스템',
  },
  gwangju_bis: {
    key: 'gwangju_bis',
    provider: '광주광역시',
    region: '광주광역시',
    category: 'city_bus',
    endpoint: 'http://apis.data.go.kr/6300000/busStopRouteInfoInqireService/getRouteInfoIem',
    responseFormat: 'xml',
    enabled: true,
    description: '광주광역시 BIS 노선-정류소 정보',
  },
  daejeon_bus: {
    key: 'daejeon_bus',
    provider: '대전광역시',
    region: '대전광역시',
    category: 'city_bus',
    endpoint: 'http://apis.data.go.kr/6300000/busRouteInfoService/getBusRouteInfo',
    responseFormat: 'xml',
    enabled: true,
    description: '대전광역시 노선정보조회 서비스',
  },
  ulsan_bis: {
    key: 'ulsan_bis',
    provider: '울산광역시',
    region: '울산광역시',
    category: 'city_bus',
    endpoint: 'http://apis.data.go.kr/6310000/busrouteservice/getBusRouteList',
    responseFormat: 'xml',
    enabled: true,
    description: '울산광역시 BIS 정보',
  },
  sejong_bus_lane: {
    key: 'sejong_bus_lane',
    provider: '세종특별자치시',
    region: '세종특별자치시',
    category: 'bus_lane',
    endpoint: 'http://apis.data.go.kr/5690000/sjBusLaneService/getBusLaneList',
    responseFormat: 'xml',
    enabled: true,
    description: '세종특별자치시 버스전용차로정보 조회 서비스',
  },
  chungju_bus: {
    key: 'chungju_bus',
    provider: '충청북도 충주시',
    region: '충청북도 충주시',
    category: 'city_bus',
    endpoint: 'http://apis.data.go.kr/4313000/busRouteService/getBusRouteList',
    responseFormat: 'xml',
    enabled: true,
    description: '충청북도 충주시 버스노선',
  },
  tago_express_bus: {
    key: 'tago_express_bus',
    provider: '국토교통부 TAGO',
    region: '전국',
    category: 'express_bus',
    endpoint: 'http://apis.data.go.kr/1613000/ExpBusInfoService/getExpBusBknfInfo',
    responseFormat: 'xml',
    enabled: true,
    description: '국토교통부 (TAGO) 고속버스정보',
  },
  tago_express_arrival: {
    key: 'tago_express_arrival',
    provider: '국토교통부 TAGO',
    region: '전국',
    category: 'express_bus_arrival',
    endpoint: 'http://apis.data.go.kr/1613000/ExpBusInfoService/getExpBusArvlInfo',
    responseFormat: 'xml',
    enabled: true,
    description: '국토교통부 (TAGO) 고속버스도착정보',
  },
  tago_intercity_bus: {
    key: 'tago_intercity_bus',
    provider: '국토교통부 TAGO',
    region: '전국',
    category: 'intercity_bus',
    endpoint: 'http://apis.data.go.kr/1613000/SuburbsBusInfoService/getStrtpntAlocFndSuberbsBusInfo',
    responseFormat: 'xml',
    enabled: true,
    description: '국토교통부 (TAGO) 시외버스정보',
  },
  kac_airport_bus: {
    key: 'kac_airport_bus',
    provider: '한국공항공사',
    region: '전국',
    category: 'airport_bus',
    endpoint: 'http://apis.data.go.kr/B551177/StatusOfBusRoutesInNationalAirports/getRoutes',
    responseFormat: 'xml',
    enabled: true,
    description: '한국공항공사 전국공항 버스노선',
  },
  incheon_airport_bus: {
    key: 'incheon_airport_bus',
    provider: '인천국제공항공사',
    region: '인천국제공항',
    category: 'airport_bus',
    endpoint: 'http://apis.data.go.kr/B551177/PassengerNoticeKR/getbusRouteList',
    responseFormat: 'xml',
    enabled: true,
    description: '인천국제공항공사 버스정보',
  },
  tago_train: {
    key: 'tago_train',
    provider: '국토교통부 TAGO',
    region: '전국',
    category: 'train',
    endpoint: 'http://apis.data.go.kr/1613000/TrainInfoService/getStrtpntAlocFndTrainInfo',
    responseFormat: 'xml',
    enabled: true,
    description: '국토교통부 (TAGO) 열차정보',
  },
};

/**
 * 활성화된 데이터 소스만 필터링
 */
export function getEnabledSources(): TransportSourceConfig[] {
  return Object.values(TRANSPORT_SOURCES).filter(source => source.enabled);
}

/**
 * 카테고리별 데이터 소스 조회
 */
export function getSourcesByCategory(category: TransportCategory): TransportSourceConfig[] {
  return Object.values(TRANSPORT_SOURCES).filter(
    source => source.category === category && source.enabled
  );
}

/**
 * 지역별 데이터 소스 조회
 */
export function getSourcesByRegion(region: string): TransportSourceConfig[] {
  return Object.values(TRANSPORT_SOURCES).filter(
    source => source.region === region && source.enabled
  );
}
