/*
  # 알림 및 로깅 시스템 완성
  
  1. alert_email_queue - 알림 이메일 큐
  2. admin_activity_logs - 관리자 활동 로그  
  3. data_validation_logs - 데이터 검증 로그
  4. longtail_combinations 검증 컬럼 추가
  5. automation_logs 이상치 탐지 컬럼 추가
*/

CREATE TABLE alert_email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  sent boolean DEFAULT false,
  sent_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alert_email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON alert_email_queue FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_alert_email_queue_sent ON alert_email_queue(sent, created_at);

CREATE TABLE admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  action text NOT NULL,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role activity access" ON admin_activity_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_admin_activity_user ON admin_activity_logs(username, created_at DESC);

CREATE TABLE data_validation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_type text NOT NULL,
  source_type text NOT NULL,
  source_id text,
  is_valid boolean NOT NULL,
  validation_errors jsonb,
  api_response jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE data_validation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role validation access" ON data_validation_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_data_validation_type ON data_validation_logs(validation_type, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='longtail_combinations' AND column_name='data_verified') THEN
    ALTER TABLE longtail_combinations ADD COLUMN data_verified boolean DEFAULT false;
    ALTER TABLE longtail_combinations ADD COLUMN verification_checked_at timestamptz;
    ALTER TABLE longtail_combinations ADD COLUMN verification_errors jsonb;
    ALTER TABLE longtail_combinations ADD COLUMN status text DEFAULT 'queued';
    ALTER TABLE longtail_combinations ADD CONSTRAINT longtail_status_check CHECK (status IN ('queued', 'verifying', 'verified', 'generating', 'published', 'failed'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='automation_logs' AND column_name='anomaly_detected') THEN
    ALTER TABLE automation_logs ADD COLUMN anomaly_detected boolean DEFAULT false;
    ALTER TABLE automation_logs ADD COLUMN anomaly_details jsonb;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_longtail_verified ON longtail_combinations(data_verified, status, search_volume DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_time ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_logs_time ON automation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_performance ON longtail_content_pages(created_at, is_published);
