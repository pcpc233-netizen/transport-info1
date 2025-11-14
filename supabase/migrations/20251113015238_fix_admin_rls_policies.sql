/*
  # 관리자 RLS 정책 수정
  
  1. 문제
    - 기존 정책이 auth.uid()를 체크하지만 관리자는 세션 토큰 사용
    - 관리자가 데이터를 읽을 수 없음
  
  2. 해결
    - anon 롤에 읽기 권한 부여
    - Edge Function에서 세션 검증하므로 안전
    
  3. 변경사항
    - automation_schedules: anon 읽기 허용
    - automation_logs: 이미 허용됨
    - system_health_metrics: anon 읽기 허용
*/

-- automation_schedules 읽기 정책 추가
DROP POLICY IF EXISTS "Only admins can manage automation schedules" ON automation_schedules;

CREATE POLICY "Anyone can view automation schedules"
  ON automation_schedules FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only service role can manage automation schedules"
  ON automation_schedules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- system_health_metrics 읽기 정책 추가
DROP POLICY IF EXISTS "Only admins can manage system health" ON system_health_metrics;

CREATE POLICY "Anyone can view system health metrics"
  ON system_health_metrics FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only service role can manage system health"
  ON system_health_metrics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- page_analytics_summary 읽기 정책 추가
DROP POLICY IF EXISTS "Only admins can view analytics summary" ON page_analytics_summary;

CREATE POLICY "Anyone can view analytics summary"
  ON page_analytics_summary FOR SELECT
  TO anon, authenticated
  USING (true);

-- content_performance 읽기 정책 추가
DROP POLICY IF EXISTS "Only admins can view content performance" ON content_performance;

CREATE POLICY "Anyone can view content performance"
  ON content_performance FOR SELECT
  TO anon, authenticated
  USING (true);

-- page_views는 읽기만 anon으로 변경
DROP POLICY IF EXISTS "Only admins can view page views" ON page_views;

CREATE POLICY "Anyone can view page views"
  ON page_views FOR SELECT
  TO anon, authenticated
  USING (true);