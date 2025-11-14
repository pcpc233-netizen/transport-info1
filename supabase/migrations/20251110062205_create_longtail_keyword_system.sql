/*
  # 롱테일 키워드 조합 및 자동 콘텐츠 생성 시스템

  ## 1. 새로운 테이블들
    
    ### `keyword_locations`
    - `id` (uuid, primary key): 지역 ID
    - `name` (text): 지역명 (서울, 부산, 강남구, 중구)
    - `parent_id` (uuid): 상위 지역
    - `level` (text): 레벨 (city, district, neighborhood)
    - `population` (integer): 인구수 (우선순위 결정)
    - `is_active` (boolean): 활성화 여부
    - `created_at` (timestamptz): 생성일
    
    ### `keyword_actions`
    - `id` (uuid, primary key): 행동 ID
    - `action` (text): 행동 (예약, 신청, 시간표, 조회, 발급)
    - `category` (text): 카테고리 연결
    - `priority` (integer): 우선순위
    - `created_at` (timestamptz): 생성일
    
    ### `keyword_seasons`
    - `id` (uuid, primary key): 시즌 ID
    - `name` (text): 시즌명 (2025년, 겨울, 설연휴, 여름휴가)
    - `season_type` (text): 타입 (year, season, holiday, period)
    - `start_date` (date): 시작일
    - `end_date` (date): 종료일
    - `is_active` (boolean): 활성화 여부
    - `created_at` (timestamptz): 생성일
    
    ### `keyword_modifiers`
    - `id` (uuid, primary key): 수식어 ID
    - `modifier` (text): 수식어 (가까운, 내 근처, 인근, 24시간, 주말)
    - `modifier_type` (text): 타입 (location, time, convenience)
    - `created_at` (timestamptz): 생성일
    
    ### `longtail_combinations`
    - `id` (uuid, primary key): 조합 ID
    - `service_id` (uuid): 서비스 외래키
    - `location_id` (uuid): 지역 외래키
    - `action_id` (uuid): 행동 외래키
    - `season_id` (uuid): 시즌 외래키
    - `modifier_id` (uuid): 수식어 외래키
    - `generated_title` (text): 생성된 제목
    - `generated_slug` (text): 생성된 URL
    - `search_volume` (integer): 예상 검색량
    - `competition` (text): 경쟁도 (low, medium, high)
    - `is_published` (boolean): 발행 여부
    - `published_at` (timestamptz): 발행일
    - `view_count` (integer): 조회수
    - `created_at` (timestamptz): 생성일
    
    ### `content_templates`
    - `id` (uuid, primary key): 템플릿 ID
    - `template_name` (text): 템플릿명
    - `category_id` (uuid): 카테고리 외래키
    - `title_template` (text): 제목 템플릿
    - `description_template` (text): 설명 템플릿
    - `content_template` (text): 본문 템플릿
    - `variables` (jsonb): 변수 리스트
    - `created_at` (timestamptz): 생성일
    
    ### `auto_content_queue`
    - `id` (uuid, primary key): 큐 ID
    - `combination_id` (uuid): 조합 외래키
    - `template_id` (uuid): 템플릿 외래키
    - `scheduled_date` (date): 예약 발행일
    - `priority` (integer): 우선순위
    - `status` (text): 상태 (pending, processing, published, failed)
    - `generated_content` (jsonb): 생성된 콘텐츠
    - `created_at` (timestamptz): 생성일
    - `processed_at` (timestamptz): 처리일

  ## 2. 보안 설정
    - RLS 활성화
*/

-- keyword_locations 테이블
CREATE TABLE IF NOT EXISTS keyword_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES keyword_locations(id),
  level text NOT NULL CHECK (level IN ('city', 'district', 'neighborhood')),
  population integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- keyword_actions 테이블
CREATE TABLE IF NOT EXISTS keyword_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  category text,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- keyword_seasons 테이블
CREATE TABLE IF NOT EXISTS keyword_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  season_type text NOT NULL CHECK (season_type IN ('year', 'season', 'holiday', 'period')),
  start_date date,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- keyword_modifiers 테이블
CREATE TABLE IF NOT EXISTS keyword_modifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modifier text NOT NULL,
  modifier_type text NOT NULL CHECK (modifier_type IN ('location', 'time', 'convenience')),
  created_at timestamptz DEFAULT now()
);

-- longtail_combinations 테이블
CREATE TABLE IF NOT EXISTS longtail_combinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  location_id uuid REFERENCES keyword_locations(id),
  action_id uuid REFERENCES keyword_actions(id),
  season_id uuid REFERENCES keyword_seasons(id),
  modifier_id uuid REFERENCES keyword_modifiers(id),
  generated_title text NOT NULL,
  generated_slug text NOT NULL UNIQUE,
  search_volume integer DEFAULT 0,
  competition text DEFAULT 'low' CHECK (competition IN ('low', 'medium', 'high')),
  is_published boolean DEFAULT false,
  published_at timestamptz,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- content_templates 테이블
CREATE TABLE IF NOT EXISTS content_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  category_id uuid REFERENCES service_categories(id),
  title_template text NOT NULL,
  description_template text NOT NULL,
  content_template text NOT NULL,
  variables jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- auto_content_queue 테이블
CREATE TABLE IF NOT EXISTS auto_content_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combination_id uuid REFERENCES longtail_combinations(id) ON DELETE CASCADE,
  template_id uuid REFERENCES content_templates(id),
  scheduled_date date NOT NULL,
  priority integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'published', 'failed')),
  generated_content jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_longtail_slug ON longtail_combinations(generated_slug);
CREATE INDEX IF NOT EXISTS idx_longtail_published ON longtail_combinations(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_queue_scheduled ON auto_content_queue(scheduled_date, status);
CREATE INDEX IF NOT EXISTS idx_queue_status ON auto_content_queue(status);
CREATE INDEX IF NOT EXISTS idx_locations_active ON keyword_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_seasons_active ON keyword_seasons(is_active);

-- RLS 활성화
ALTER TABLE keyword_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE longtail_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_content_queue ENABLE ROW LEVEL SECURITY;

-- 읽기 정책
CREATE POLICY "Anyone can view active locations"
  ON keyword_locations FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Anyone can view actions"
  ON keyword_actions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view active seasons"
  ON keyword_seasons FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Anyone can view modifiers"
  ON keyword_modifiers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view published combinations"
  ON longtail_combinations FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Anyone can view templates"
  ON content_templates FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view queue"
  ON auto_content_queue FOR SELECT
  TO anon, authenticated
  USING (true);