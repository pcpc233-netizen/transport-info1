/*
  # 실제 가치를 제공하는 기능 추가

  1. 사용자 기능
    - 즐겨찾기 시스템
    - 알림 설정
    - 맞춤형 추천
  
  2. 리뷰 및 평가
    - 실제 사용자 리뷰
    - 별점 시스템
    - 사진 업로드
  
  3. 실시간 정보
    - 혼잡도 정보
    - 대기 시간
    - 운행 상태
*/

-- 사용자 즐겨찾기
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, service_id)
);

-- 사용자 리뷰 및 평가
CREATE TABLE IF NOT EXISTS service_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 실시간 상태 정보
CREATE TABLE IF NOT EXISTS service_realtime_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  status_type text NOT NULL, -- 'crowded', 'delayed', 'closed', 'normal'
  status_value jsonb, -- 혼잡도, 지연시간 등
  reported_by uuid REFERENCES auth.users(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 알림 설정
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  notification_type text NOT NULL, -- 'schedule_change', 'delay', 'closure'
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 실제 API 데이터 캐시
CREATE TABLE IF NOT EXISTS api_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  data_type text NOT NULL, -- 'bus_arrival', 'hospital_wait', 'passport_queue'
  data jsonb NOT NULL,
  fetched_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 사용자 검색 기록 (추천 개선용)
CREATE TABLE IF NOT EXISTS user_search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query text NOT NULL,
  result_count integer,
  clicked_service_id uuid REFERENCES services(id),
  created_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_service ON service_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_rating ON service_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_realtime_status_service ON service_realtime_status(service_id);
CREATE INDEX IF NOT EXISTS idx_realtime_status_expires ON service_realtime_status(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_cache_service ON api_data_cache(service_id);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_data_cache(expires_at);

-- RLS 활성화
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_realtime_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites"
  ON user_favorites FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view reviews"
  ON service_reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create reviews"
  ON service_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON service_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view realtime status"
  ON service_realtime_status FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can report status"
  ON service_realtime_status FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Anyone can view cached data"
  ON api_data_cache FOR SELECT
  TO public
  USING (expires_at > now());
