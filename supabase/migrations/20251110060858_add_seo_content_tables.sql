/*
  # SEO 및 상세 콘텐츠 테이블 추가

  ## 1. 새로운 테이블들
    
    ### `service_faqs`
    - `id` (uuid, primary key): FAQ 고유 ID
    - `service_id` (uuid): 서비스 외래키
    - `question` (text): 질문
    - `answer` (text): 답변
    - `order_index` (integer): 정렬 순서
    - `created_at` (timestamptz): 생성일
    
    ### `service_requirements`
    - `id` (uuid, primary key): 요구사항 고유 ID
    - `service_id` (uuid): 서비스 외래키
    - `requirement_type` (text): 타입 (document, fee, time, preparation)
    - `title` (text): 제목
    - `description` (text): 설명
    - `details` (jsonb): 상세 정보
    - `order_index` (integer): 정렬 순서
    - `created_at` (timestamptz): 생성일
    
    ### `service_guides`
    - `id` (uuid, primary key): 가이드 고유 ID
    - `service_id` (uuid): 서비스 외래키
    - `step_number` (integer): 단계 번호
    - `title` (text): 단계 제목
    - `description` (text): 단계 설명
    - `image_url` (text): 이미지 URL (선택)
    - `tips` (text): 팁
    - `created_at` (timestamptz): 생성일
    
    ### `service_fees`
    - `id` (uuid, primary key): 요금 고유 ID
    - `service_id` (uuid): 서비스 외래키
    - `fee_type` (text): 요금 타입 (regular, express, discount)
    - `name` (text): 요금명
    - `amount` (numeric): 금액
    - `description` (text): 설명
    - `conditions` (text): 적용 조건
    - `created_at` (timestamptz): 생성일
    
    ### `service_regulations`
    - `id` (uuid, primary key): 규정 고유 ID
    - `service_id` (uuid): 서비스 외래키
    - `regulation_type` (text): 규정 타입 (law, policy, notice)
    - `title` (text): 규정 제목
    - `content` (text): 규정 내용
    - `source_url` (text): 출처 URL
    - `effective_date` (date): 시행일
    - `created_at` (timestamptz): 생성일
    
    ### `service_related`
    - `id` (uuid, primary key): 관계 고유 ID
    - `service_id` (uuid): 원본 서비스 외래키
    - `related_service_id` (uuid): 관련 서비스 외래키
    - `relation_type` (text): 관계 타입 (alternative, nearby, similar)
    - `description` (text): 관계 설명
    - `created_at` (timestamptz): 생성일

  ## 2. services 테이블 확장
    - `seo_keywords` (text[]): SEO 키워드 배열
    - `long_description` (text): 긴 설명
    - `usage_tips` (text): 이용 팁
    - `best_time` (text): 추천 이용 시간
    - `average_duration` (text): 평균 소요 시간
    - `difficulty_level` (text): 난이도 (easy, medium, hard)

  ## 3. 보안 설정
    - 모든 테이블에 RLS 활성화
    - 읽기 전체 허용
*/

-- service_faqs 테이블
CREATE TABLE IF NOT EXISTS service_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- service_requirements 테이블
CREATE TABLE IF NOT EXISTS service_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  requirement_type text NOT NULL CHECK (requirement_type IN ('document', 'fee', 'time', 'preparation', 'other')),
  title text NOT NULL,
  description text,
  details jsonb DEFAULT '{}',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- service_guides 테이블
CREATE TABLE IF NOT EXISTS service_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  tips text,
  created_at timestamptz DEFAULT now()
);

-- service_fees 테이블
CREATE TABLE IF NOT EXISTS service_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  fee_type text NOT NULL CHECK (fee_type IN ('regular', 'express', 'discount', 'special')),
  name text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  description text,
  conditions text,
  created_at timestamptz DEFAULT now()
);

-- service_regulations 테이블
CREATE TABLE IF NOT EXISTS service_regulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  regulation_type text NOT NULL CHECK (regulation_type IN ('law', 'policy', 'notice', 'warning')),
  title text NOT NULL,
  content text NOT NULL,
  source_url text,
  effective_date date,
  created_at timestamptz DEFAULT now()
);

-- service_related 테이블
CREATE TABLE IF NOT EXISTS service_related (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  related_service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  relation_type text NOT NULL CHECK (relation_type IN ('alternative', 'nearby', 'similar', 'recommended')),
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(service_id, related_service_id)
);

-- services 테이블 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'seo_keywords'
  ) THEN
    ALTER TABLE services ADD COLUMN seo_keywords text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'long_description'
  ) THEN
    ALTER TABLE services ADD COLUMN long_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'usage_tips'
  ) THEN
    ALTER TABLE services ADD COLUMN usage_tips text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'best_time'
  ) THEN
    ALTER TABLE services ADD COLUMN best_time text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'average_duration'
  ) THEN
    ALTER TABLE services ADD COLUMN average_duration text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'difficulty_level'
  ) THEN
    ALTER TABLE services ADD COLUMN difficulty_level text CHECK (difficulty_level IN ('easy', 'medium', 'hard'));
  END IF;
END $$;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_faqs_service ON service_faqs(service_id);
CREATE INDEX IF NOT EXISTS idx_requirements_service ON service_requirements(service_id);
CREATE INDEX IF NOT EXISTS idx_guides_service ON service_guides(service_id);
CREATE INDEX IF NOT EXISTS idx_fees_service ON service_fees(service_id);
CREATE INDEX IF NOT EXISTS idx_regulations_service ON service_regulations(service_id);
CREATE INDEX IF NOT EXISTS idx_related_service ON service_related(service_id);

-- RLS 활성화
ALTER TABLE service_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_related ENABLE ROW LEVEL SECURITY;

-- 읽기 정책
CREATE POLICY "Anyone can view FAQs"
  ON service_faqs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view requirements"
  ON service_requirements FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view guides"
  ON service_guides FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view fees"
  ON service_fees FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view regulations"
  ON service_regulations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view related services"
  ON service_related FOR SELECT
  TO anon, authenticated
  USING (true);