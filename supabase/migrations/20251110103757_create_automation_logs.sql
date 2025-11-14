/*
  # 자동화 로그 테이블 생성

  ## 1. 새로운 테이블
    
    ### `automation_logs`
    - `id` (uuid, primary key): 로그 고유 ID
    - `job_type` (text): 작업 유형
    - `generated_count` (integer): 생성된 항목 수
    - `published_count` (integer): 발행된 항목 수
    - `errors` (jsonb): 오류 목록
    - `executed_at` (timestamptz): 실행 시간
    - `created_at` (timestamptz): 생성일

  ## 2. 보안 설정
    - RLS 활성화
    - 읽기 전체 허용
*/

CREATE TABLE IF NOT EXISTS automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  generated_count integer DEFAULT 0,
  published_count integer DEFAULT 0,
  errors jsonb DEFAULT '[]',
  executed_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_executed ON automation_logs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_logs_job_type ON automation_logs(job_type);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view automation logs"
  ON automation_logs FOR SELECT
  TO anon, authenticated
  USING (true);
