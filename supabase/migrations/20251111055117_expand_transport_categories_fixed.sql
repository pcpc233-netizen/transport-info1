/*
  # 교통 카테고리 대폭 확장 - 롱테일 SEO 전략

  ## 1. 새로운 교통 카테고리
    - 고속버스 (시외버스, 직행버스, 심야버스)
    - 시내버스 (간선버스, 지선버스, 광역버스, 마을버스, 공항버스)
    - GTX (A/B/C/D노선, 역별 시간표)

  ## 2. 지역 데이터 확장
    - 전국 주요 도시
    - 주요 구/군

  ## 3. 키워드 조합 확장
    - 행동, 시즌, 수식어

  ## 4. 보안
    - RLS 정책 유지
*/

-- 1. 교통 카테고리 추가
INSERT INTO service_categories (name, slug, icon, description) VALUES
  ('고속버스', 'express-bus', 'bus', '전국 고속버스 시간표 및 예약 정보'),
  ('시외버스', 'intercity-bus', 'bus', '시외버스 노선 및 운행 정보'),
  ('시내버스', 'city-bus', 'bus', '시내버스 실시간 도착 정보'),
  ('마을버스', 'local-bus', 'bus', '마을버스 노선 및 시간표'),
  ('공항버스', 'airport-bus', 'plane', '공항버스 노선 및 시간표'),
  ('GTX', 'gtx', 'train', 'GTX 노선 및 역 정보'),
  ('지하철', 'subway', 'train', '지하철 노선도 및 시간표')
ON CONFLICT (slug) DO NOTHING;

-- 2. 전국 주요 지역 데이터
INSERT INTO keyword_locations (name, level, population, is_active) VALUES
  ('서울', 'city', 9700000, true),
  ('경기', 'city', 13500000, true),
  ('인천', 'city', 3000000, true),
  ('부산', 'city', 3400000, true),
  ('대구', 'city', 2400000, true),
  ('광주', 'city', 1500000, true),
  ('대전', 'city', 1500000, true),
  ('울산', 'city', 1150000, true),
  ('세종', 'city', 370000, true),
  ('강원', 'city', 1540000, true),
  ('충북', 'city', 1600000, true),
  ('충남', 'city', 2120000, true),
  ('전북', 'city', 1820000, true),
  ('전남', 'city', 1850000, true),
  ('경북', 'city', 2640000, true),
  ('경남', 'city', 3350000, true),
  ('제주', 'city', 680000, true)
ON CONFLICT DO NOTHING;

-- 서울 주요 구 데이터
DO $$
DECLARE
  seoul_id uuid;
BEGIN
  SELECT id INTO seoul_id FROM keyword_locations WHERE name = '서울' AND level = 'city' LIMIT 1;
  
  IF seoul_id IS NOT NULL THEN
    INSERT INTO keyword_locations (name, parent_id, level, population, is_active) VALUES
      ('강남구', seoul_id, 'district', 540000, true),
      ('서초구', seoul_id, 'district', 440000, true),
      ('송파구', seoul_id, 'district', 670000, true),
      ('강동구', seoul_id, 'district', 440000, true),
      ('영등포구', seoul_id, 'district', 380000, true),
      ('구로구', seoul_id, 'district', 410000, true),
      ('관악구', seoul_id, 'district', 500000, true),
      ('마포구', seoul_id, 'district', 370000, true),
      ('종로구', seoul_id, 'district', 150000, true),
      ('중구', seoul_id, 'district', 130000, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 3. 교통 관련 행동 키워드
INSERT INTO keyword_actions (action, category, priority) VALUES
  ('시간표', 'transport', 10),
  ('조회', 'transport', 9),
  ('예약', 'transport', 8),
  ('요금', 'transport', 7),
  ('운행시간', 'transport', 6),
  ('노선도', 'transport', 5),
  ('터미널', 'transport', 4),
  ('정류장', 'transport', 3),
  ('첫차', 'transport', 2),
  ('막차', 'transport', 1)
ON CONFLICT DO NOTHING;

-- 4. 시즌 키워드
INSERT INTO keyword_seasons (name, season_type, start_date, end_date, is_active) VALUES
  ('2025년', 'year', '2025-01-01', '2025-12-31', true),
  ('설연휴', 'holiday', '2025-01-28', '2025-01-30', true),
  ('추석연휴', 'holiday', '2025-10-05', '2025-10-08', true),
  ('여름휴가', 'period', '2025-07-01', '2025-08-31', true),
  ('겨울방학', 'period', '2025-12-20', '2026-02-28', true)
ON CONFLICT DO NOTHING;

-- 5. 수식어
INSERT INTO keyword_modifiers (modifier, modifier_type) VALUES
  ('빠른', 'convenience'),
  ('저렴한', 'convenience'),
  ('직행', 'convenience'),
  ('심야', 'time'),
  ('새벽', 'time'),
  ('주말', 'time'),
  ('평일', 'time'),
  ('실시간', 'convenience'),
  ('가까운', 'location'),
  ('내 근처', 'location')
ON CONFLICT DO NOTHING;

-- 6. 콘텐츠 템플릿
INSERT INTO content_templates (template_name, title_template, description_template, content_template, variables) VALUES
  (
    '고속버스 시간표',
    '{location} {service} 시간표 {season}',
    '{location}에서 이용 가능한 {service} 시간표를 확인하세요. {season} 운행 정보와 예약 방법을 제공합니다.',
    '<h2>{location} {service} 시간표</h2>
<p>{location}의 {service} 운행 시간표를 안내합니다.</p>

<h3>주요 노선</h3>
<ul>
<li>서울-부산 노선: 매일 06:00~23:00 운행</li>
<li>서울-대구 노선: 매일 05:30~22:30 운행</li>
<li>서울-광주 노선: 매일 06:00~21:00 운행</li>
</ul>

<h3>이용 요금</h3>
<p>기본 요금은 노선 거리에 따라 다르며, 온라인 예매 시 할인 혜택이 있습니다.</p>

<h3>예약 방법</h3>
<p>온라인 예매 또는 현장 구매가 가능합니다.</p>',
    '["location", "service", "season"]'::jsonb
  ),
  (
    'GTX 시간표',
    '{location} GTX {modifier} 시간표',
    '{location} GTX 노선의 상세 시간표와 역 정보를 확인하세요. 빠르고 편리한 수도권 광역급행철도 이용 가이드.',
    '<h2>{location} GTX 시간표</h2>
<p>수도권 광역급행철도 GTX의 {location} 노선 정보입니다.</p>

<h3>운행 시간</h3>
<ul>
<li>평일: 첫차 05:30 / 막차 24:00</li>
<li>주말: 첫차 06:00 / 막차 23:30</li>
</ul>

<h3>주요 정차역</h3>
<p>삼성역, 수서역, 동탄역 등 주요 역에 정차합니다.</p>

<h3>요금 정보</h3>
<p>기본요금 1,500원부터 시작하며, 거리에 따라 추가 요금이 부과됩니다.</p>',
    '["location", "modifier"]'::jsonb
  )
ON CONFLICT DO NOTHING;