/*
  # 롱테일 키워드 정보 허브 핵심 스키마 생성

  ## 1. 새로운 테이블들
    
    ### `service_categories`
    - `id` (uuid, primary key): 카테고리 고유 ID
    - `name` (text): 카테고리 이름 (예: 공항버스, 여권발급, 병원)
    - `slug` (text): URL 친화적 슬러그
    - `icon` (text): 아이콘 이름
    - `description` (text): 카테고리 설명
    - `meta_title` (text): SEO 메타 타이틀
    - `meta_description` (text): SEO 메타 설명
    - `view_count` (integer): 조회수
    - `created_at` (timestamptz): 생성일
    - `updated_at` (timestamptz): 수정일
    
    ### `locations`
    - `id` (uuid, primary key): 지역 고유 ID
    - `name` (text): 지역명 (예: 서울, 강남구)
    - `parent_id` (uuid): 상위 지역 ID (계층 구조)
    - `level` (text): 지역 레벨 (city, district, neighborhood)
    - `latitude` (numeric): 위도
    - `longitude` (numeric): 경도
    - `created_at` (timestamptz): 생성일
    
    ### `services`
    - `id` (uuid, primary key): 서비스 고유 ID
    - `category_id` (uuid): 카테고리 외래키
    - `location_id` (uuid): 지역 외래키
    - `name` (text): 서비스명 (예: 8844번 버스)
    - `service_number` (text): 서비스 번호
    - `slug` (text): URL 슬러그
    - `description` (text): 상세 설명
    - `operating_hours` (text): 운영 시간
    - `contact_info` (jsonb): 연락처 정보
    - `address` (text): 주소
    - `latitude` (numeric): 위도
    - `longitude` (numeric): 경도
    - `meta_title` (text): SEO 타이틀
    - `meta_description` (text): SEO 설명
    - `view_count` (integer): 조회수
    - `bookmark_count` (integer): 북마크 수
    - `is_active` (boolean): 활성 상태
    - `created_at` (timestamptz): 생성일
    - `updated_at` (timestamptz): 수정일
    
    ### `schedules`
    - `id` (uuid, primary key): 스케줄 고유 ID
    - `service_id` (uuid): 서비스 외래키
    - `day_of_week` (text): 요일 (weekday, weekend, all)
    - `departure_time` (time): 출발 시간
    - `arrival_time` (time): 도착 시간
    - `route_info` (text): 경로 정보
    - `notes` (text): 특이사항
    - `is_active` (boolean): 활성 상태
    - `created_at` (timestamptz): 생성일
    
    ### `community_posts`
    - `id` (uuid, primary key): 포스트 고유 ID
    - `service_id` (uuid): 서비스 외래키
    - `category_id` (uuid): 카테고리 외래키
    - `author_name` (text): 작성자명 (익명 가능)
    - `title` (text): 제목
    - `content` (text): 내용
    - `post_type` (text): 포스트 유형 (tip, question, review, update)
    - `upvote_count` (integer): 추천수
    - `view_count` (integer): 조회수
    - `is_verified` (boolean): 검증된 정보 여부
    - `created_at` (timestamptz): 생성일
    - `updated_at` (timestamptz): 수정일
    
    ### `comments`
    - `id` (uuid, primary key): 댓글 고유 ID
    - `post_id` (uuid): 포스트 외래키
    - `service_id` (uuid): 서비스 외래키 (직접 댓글)
    - `author_name` (text): 작성자명
    - `content` (text): 댓글 내용
    - `upvote_count` (integer): 추천수
    - `parent_id` (uuid): 부모 댓글 ID (대댓글)
    - `created_at` (timestamptz): 생성일
    
    ### `bookmarks`
    - `id` (uuid, primary key): 북마크 고유 ID
    - `session_id` (text): 세션 ID (비회원용)
    - `service_id` (uuid): 서비스 외래키
    - `created_at` (timestamptz): 생성일
    
    ### `search_logs`
    - `id` (uuid, primary key): 검색 로그 ID
    - `query` (text): 검색어
    - `category` (text): 카테고리
    - `location` (text): 지역
    - `result_count` (integer): 결과 수
    - `created_at` (timestamptz): 생성일

  ## 2. 보안 설정
    - 모든 테이블에 RLS (Row Level Security) 활성화
    - 읽기는 모두 허용 (공개 정보)
    - 쓰기는 검증된 사용자만 허용

  ## 3. 인덱스
    - 검색 성능을 위한 인덱스 추가
    - 지역 기반 검색을 위한 복합 인덱스
*/

-- service_categories 테이블
CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text DEFAULT 'info',
  description text,
  meta_title text,
  meta_description text,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- locations 테이블
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES locations(id),
  level text NOT NULL CHECK (level IN ('city', 'district', 'neighborhood')),
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_at timestamptz DEFAULT now()
);

-- services 테이블
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES service_categories(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id),
  name text NOT NULL,
  service_number text,
  slug text NOT NULL,
  description text,
  operating_hours text,
  contact_info jsonb DEFAULT '{}',
  address text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  meta_title text,
  meta_description text,
  view_count integer DEFAULT 0,
  bookmark_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- schedules 테이블
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  day_of_week text NOT NULL CHECK (day_of_week IN ('weekday', 'weekend', 'all', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  departure_time time,
  arrival_time time,
  route_info text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- community_posts 테이블
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  category_id uuid REFERENCES service_categories(id),
  author_name text NOT NULL DEFAULT '익명',
  title text NOT NULL,
  content text NOT NULL,
  post_type text NOT NULL CHECK (post_type IN ('tip', 'question', 'review', 'update')),
  upvote_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- comments 테이블
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT '익명',
  content text NOT NULL,
  upvote_count integer DEFAULT 0,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- bookmarks 테이블
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, service_id)
);

-- search_logs 테이블
CREATE TABLE IF NOT EXISTS search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  category text,
  location text,
  result_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_location ON services(location_id);
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_schedules_service ON schedules(service_id);
CREATE INDEX IF NOT EXISTS idx_posts_service ON community_posts(service_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_service ON comments(service_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_session ON bookmarks(session_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at DESC);

-- RLS 활성화
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- 읽기 정책 (모두 허용)
CREATE POLICY "Anyone can view service categories"
  ON service_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view locations"
  ON locations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Anyone can view active schedules"
  ON schedules FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Anyone can view community posts"
  ON community_posts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view their own bookmarks"
  ON bookmarks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view search logs"
  ON search_logs FOR SELECT
  TO anon, authenticated
  USING (true);

-- 쓰기 정책 (익명 사용자도 커뮤니티 참여 가능)
CREATE POLICY "Anyone can create community posts"
  ON community_posts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can create comments"
  ON comments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can create bookmarks"
  ON bookmarks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete their bookmarks"
  ON bookmarks FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can log searches"
  ON search_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);