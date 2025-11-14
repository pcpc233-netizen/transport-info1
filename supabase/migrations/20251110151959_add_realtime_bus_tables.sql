/*
  # 실시간 버스 정보 테이블 추가

  1. 새로운 테이블
    - `bus_stops` - 버스 정류소 정보
      - `id` (uuid, primary key)
      - `stop_id` (text, unique) - 정류소 고유 ID
      - `stop_name` (text) - 정류소 이름
      - `latitude` (numeric) - 위도
      - `longitude` (numeric) - 경도
      - `district` (text) - 구/지역
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `bus_locations` - 실시간 버스 위치 (최근 데이터만 보관)
      - `id` (uuid, primary key)
      - `bus_route_id` (text) - 버스 노선 ID
      - `bus_number` (text) - 버스 번호
      - `vehicle_number` (text) - 차량 번호
      - `latitude` (numeric) - 현재 위도
      - `longitude` (numeric) - 현재 경도
      - `stop_sequence` (integer) - 정류소 순번
      - `last_stop_id` (text) - 마지막 정류소 ID
      - `updated_at` (timestamptz)
    
    - `bus_arrivals` - 버스 도착 예정 정보 (캐시용)
      - `id` (uuid, primary key)
      - `stop_id` (text) - 정류소 ID
      - `bus_number` (text) - 버스 번호
      - `bus_route_id` (text) - 버스 노선 ID
      - `arrival_time` (integer) - 도착 예정 시간(초)
      - `remaining_stops` (integer) - 남은 정류소 수
      - `vehicle_number` (text) - 차량 번호
      - `is_full` (boolean) - 만차 여부
      - `updated_at` (timestamptz)

  2. 보안
    - 모든 테이블에 RLS 활성화
    - 공개 읽기 정책 추가 (실시간 교통 정보는 공개)
    - 관리자만 쓰기 가능

  3. 인덱스
    - 빠른 조회를 위한 인덱스 추가
*/

-- 버스 정류소 테이블
CREATE TABLE IF NOT EXISTS bus_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id text UNIQUE NOT NULL,
  stop_name text NOT NULL,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  district text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 실시간 버스 위치 테이블
CREATE TABLE IF NOT EXISTS bus_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_route_id text NOT NULL,
  bus_number text NOT NULL,
  vehicle_number text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  stop_sequence integer,
  last_stop_id text,
  updated_at timestamptz DEFAULT now()
);

-- 버스 도착 정보 테이블
CREATE TABLE IF NOT EXISTS bus_arrivals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id text NOT NULL,
  bus_number text NOT NULL,
  bus_route_id text,
  arrival_time integer,
  remaining_stops integer,
  vehicle_number text,
  is_full boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bus_stops_stop_id ON bus_stops(stop_id);
CREATE INDEX IF NOT EXISTS idx_bus_stops_district ON bus_stops(district);
CREATE INDEX IF NOT EXISTS idx_bus_locations_bus_number ON bus_locations(bus_number);
CREATE INDEX IF NOT EXISTS idx_bus_locations_updated ON bus_locations(updated_at);
CREATE INDEX IF NOT EXISTS idx_bus_arrivals_stop_id ON bus_arrivals(stop_id);
CREATE INDEX IF NOT EXISTS idx_bus_arrivals_bus_number ON bus_arrivals(bus_number);

-- RLS 활성화
ALTER TABLE bus_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_arrivals ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (실시간 교통 정보는 누구나 볼 수 있음)
CREATE POLICY "Anyone can view bus stops"
  ON bus_stops FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view bus locations"
  ON bus_locations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view bus arrivals"
  ON bus_arrivals FOR SELECT
  TO public
  USING (true);

-- Service role만 쓰기 가능 (Edge Functions에서만 업데이트)
CREATE POLICY "Service role can manage bus stops"
  ON bus_stops FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage bus locations"
  ON bus_locations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage bus arrivals"
  ON bus_arrivals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bus_stops_updated_at BEFORE UPDATE ON bus_stops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bus_locations_updated_at BEFORE UPDATE ON bus_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bus_arrivals_updated_at BEFORE UPDATE ON bus_arrivals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();