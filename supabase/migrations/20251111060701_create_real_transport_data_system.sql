/*
  # 실제 교통 데이터 기반 롱테일 콘텐츠 시스템

  ## 1. 새로운 테이블
    
    ### `transport_routes`
    - 실제 버스/기차 노선 정보
    - 노선번호, 출발지, 도착지, 운행사, 소요시간
    
    ### `transport_stops`
    - 실제 정류장/역 정보
    - 정류장명, 정류장ID, 위치, 구/동
    
    ### `route_stops`
    - 노선별 정류장 매핑
    - 순서, 시간표, 요금
    
    ### `longtail_content_pages`
    - 자동 생성된 콘텐츠 페이지
    - 제목, 본문, 메타데이터, URL slug

  ## 2. 보안
    - RLS 활성화
*/

-- transport_routes 테이블
CREATE TABLE IF NOT EXISTS transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_number text NOT NULL,
  route_name text NOT NULL,
  category text NOT NULL,
  operator text,
  origin text NOT NULL,
  destination text NOT NULL,
  travel_time_minutes integer,
  fare_adult integer,
  fare_youth integer,
  fare_child integer,
  frequency_minutes integer,
  daily_trips integer,
  first_departure time,
  last_departure time,
  booking_url text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- transport_stops 테이블
CREATE TABLE IF NOT EXISTS transport_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_code text UNIQUE,
  stop_name text NOT NULL,
  district text,
  neighborhood text,
  address text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  stop_type text CHECK (stop_type IN ('bus', 'airport_bus', 'subway', 'gtx')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- route_stops 테이블
CREATE TABLE IF NOT EXISTS route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES transport_routes(id) ON DELETE CASCADE,
  stop_id uuid REFERENCES transport_stops(id) ON DELETE CASCADE,
  stop_sequence integer NOT NULL,
  arrival_time time,
  fare_from_here integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(route_id, stop_sequence)
);

-- longtail_content_pages 테이블
CREATE TABLE IF NOT EXISTS longtail_content_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES transport_routes(id) ON DELETE CASCADE,
  stop_id uuid REFERENCES transport_stops(id),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  meta_description text,
  content_html text NOT NULL,
  keywords text[],
  target_keyword text,
  search_volume integer DEFAULT 0,
  is_published boolean DEFAULT true,
  view_count integer DEFAULT 0,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_routes_number ON transport_routes(route_number);
CREATE INDEX IF NOT EXISTS idx_routes_category ON transport_routes(category);
CREATE INDEX IF NOT EXISTS idx_stops_name ON transport_stops(stop_name);
CREATE INDEX IF NOT EXISTS idx_stops_district ON transport_stops(district);
CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_content_slug ON longtail_content_pages(slug);
CREATE INDEX IF NOT EXISTS idx_content_published ON longtail_content_pages(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_content_route ON longtail_content_pages(route_id);

-- RLS 활성화
ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE longtail_content_pages ENABLE ROW LEVEL SECURITY;

-- 읽기 정책
CREATE POLICY "Anyone can view active routes"
  ON transport_routes FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Anyone can view active stops"
  ON transport_stops FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Anyone can view route stops"
  ON route_stops FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view published content"
  ON longtail_content_pages FOR SELECT
  TO anon, authenticated
  USING (is_published = true);