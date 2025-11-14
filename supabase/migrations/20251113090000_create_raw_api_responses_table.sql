/*
  # Raw API Responses 테이블 생성

  1. 새 테이블
    - `raw_api_responses`
      - `id` (uuid, primary key)
      - `source_key` (text) - 데이터 소스 식별자
      - `provider` (text) - 데이터 제공기관
      - `region` (text) - 지역
      - `category` (text) - 카테고리
      - `endpoint` (text) - API 엔드포인트
      - `response_format` (text) - 응답 형식 (xml/json)
      - `raw_data` (text) - 원본 응답 데이터
      - `status` (text) - 수집 상태
      - `collected_at` (timestamptz) - 수집 시각
      - `created_at` (timestamptz)

  2. 보안
    - Enable RLS
    - 서비스 역할만 접근 가능

  3. 인덱스
    - source_key, collected_at으로 조회 최적화
*/

CREATE TABLE IF NOT EXISTS raw_api_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL,
  provider text NOT NULL,
  region text NOT NULL,
  category text NOT NULL,
  endpoint text NOT NULL,
  response_format text NOT NULL DEFAULT 'xml',
  raw_data text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  collected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE raw_api_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert raw API responses"
  ON raw_api_responses
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read raw API responses"
  ON raw_api_responses
  FOR SELECT
  TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_raw_api_responses_source_key
  ON raw_api_responses(source_key);

CREATE INDEX IF NOT EXISTS idx_raw_api_responses_collected_at
  ON raw_api_responses(collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_raw_api_responses_source_collected
  ON raw_api_responses(source_key, collected_at DESC);
