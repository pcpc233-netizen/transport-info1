-- 롱테일 키워드 조합 대량 생성 스크립트
-- 이 스크립트를 실행하면 수천 개의 SEO 최적화 페이지 조합이 자동 생성됩니다

-- ============================================
-- 1단계: 모든 가능한 조합 생성
-- ============================================

-- 공항버스 조합 (지역 x 서비스 x 행동 x 시기)
INSERT INTO longtail_combinations (
  service_id,
  location_id,
  action_id,
  season_id,
  generated_title,
  generated_slug,
  search_volume,
  competition,
  is_published
)
SELECT
  s.id as service_id,
  l.id as location_id,
  a.id as action_id,
  se.id as season_id,
  -- 제목 생성: "서울 8844번 공항버스 시간표 2025년"
  l.name || ' ' || s.name || ' ' || a.action || ' ' || se.name as generated_title,
  -- URL 슬러그 생성: "서울-8844번-공항버스-시간표-2025년"
  lower(
    regexp_replace(
      l.name || '-' || s.service_number || '번-' || s.name || '-' || a.action || '-' || se.name,
      '[^a-z0-9가-힣]+',
      '-',
      'g'
    )
  ) as generated_slug,
  -- 검색량 예측 (인구수 기반)
  CASE
    WHEN l.population > 1000000 THEN 1000
    WHEN l.population > 500000 THEN 500
    WHEN l.population > 100000 THEN 200
    ELSE 100
  END *
  CASE
    WHEN a.action IN ('예약', '신청', '시간표') THEN 1.5
    WHEN a.action IN ('요금', '위치') THEN 1.2
    ELSE 1.0
  END as search_volume,
  -- 경쟁도 예측
  CASE
    WHEN l.population > 1000000 AND a.action IN ('예약', '신청') THEN 'high'
    WHEN l.population > 500000 THEN 'medium'
    ELSE 'low'
  END as competition,
  false as is_published
FROM services s
CROSS JOIN keyword_locations l
CROSS JOIN keyword_actions a
CROSS JOIN keyword_seasons se
WHERE
  s.category_id IN (SELECT id FROM service_categories WHERE slug = 'airport-bus')
  AND l.is_active = true
  AND se.is_active = true
  AND a.action IN ('시간표', '요금', '예약', '위치', '운영시간')
ON CONFLICT (generated_slug) DO NOTHING;

-- 여권발급 조합
INSERT INTO longtail_combinations (
  service_id,
  location_id,
  action_id,
  season_id,
  generated_title,
  generated_slug,
  search_volume,
  competition,
  is_published
)
SELECT
  s.id,
  l.id,
  a.id,
  se.id,
  l.name || ' 여권 ' || a.action || ' ' || se.name as generated_title,
  lower(
    regexp_replace(
      l.name || '-여권-' || a.action || '-' || se.name,
      '[^a-z0-9가-힣]+',
      '-',
      'g'
    )
  ) as generated_slug,
  CASE
    WHEN l.population > 1000000 THEN 1500
    WHEN l.population > 500000 THEN 800
    ELSE 300
  END *
  CASE
    WHEN a.action IN ('예약', '신청', '발급') THEN 2.0
    ELSE 1.0
  END as search_volume,
  CASE
    WHEN l.population > 1000000 THEN 'high'
    WHEN l.population > 500000 THEN 'medium'
    ELSE 'low'
  END as competition,
  false
FROM services s
CROSS JOIN keyword_locations l
CROSS JOIN keyword_actions a
CROSS JOIN keyword_seasons se
WHERE
  s.category_id IN (SELECT id FROM service_categories WHERE slug = 'passport')
  AND l.is_active = true
  AND se.is_active = true
  AND se.name IN ('2025년', '2026년')
  AND a.action IN ('예약', '신청', '발급', '조회', '위치', '운영시간')
ON CONFLICT (generated_slug) DO NOTHING;

-- 병원 조합
INSERT INTO longtail_combinations (
  service_id,
  location_id,
  action_id,
  season_id,
  generated_title,
  generated_slug,
  search_volume,
  competition,
  is_published
)
SELECT
  s.id,
  l.id,
  a.id,
  se.id,
  l.name || ' ' || s.name || ' ' || a.action || ' ' || se.name as generated_title,
  lower(
    regexp_replace(
      l.name || '-병원-' || a.action || '-' || se.name,
      '[^a-z0-9가-힣]+',
      '-',
      'g'
    )
  ) as generated_slug,
  CASE
    WHEN l.population > 1000000 THEN 800
    WHEN l.population > 500000 THEN 400
    ELSE 150
  END as search_volume,
  'medium' as competition,
  false
FROM services s
CROSS JOIN keyword_locations l
CROSS JOIN keyword_actions a
CROSS JOIN keyword_seasons se
WHERE
  s.category_id IN (SELECT id FROM service_categories WHERE slug = 'hospital')
  AND l.is_active = true
  AND se.is_active = true
  AND a.action IN ('예약', '진료시간', '위치', '휴무일')
ON CONFLICT (generated_slug) DO NOTHING;

-- ============================================
-- 2단계: 수식어 조합 추가
-- ============================================

-- "가까운", "내 근처" 등 수식어가 있는 조합
INSERT INTO longtail_combinations (
  service_id,
  location_id,
  action_id,
  modifier_id,
  generated_title,
  generated_slug,
  search_volume,
  competition,
  is_published
)
SELECT
  s.id,
  l.id,
  a.id,
  m.id,
  l.name || ' ' || m.modifier || ' ' || s.name || ' ' || a.action as generated_title,
  lower(
    regexp_replace(
      l.name || '-' || m.modifier || '-' || s.name || '-' || a.action,
      '[^a-z0-9가-힣]+',
      '-',
      'g'
    )
  ) as generated_slug,
  CASE
    WHEN m.modifier IN ('가까운', '내 근처') THEN 1200
    ELSE 600
  END as search_volume,
  'medium' as competition,
  false
FROM services s
CROSS JOIN keyword_locations l
CROSS JOIN keyword_actions a
CROSS JOIN keyword_modifiers m
WHERE
  l.is_active = true
  AND m.modifier_type = 'location'
  AND a.action IN ('위치', '예약', '신청')
ON CONFLICT (generated_slug) DO NOTHING;

-- ============================================
-- 3단계: 우선순위 기반 발행 스케줄 생성
-- ============================================

-- 검색량이 높은 조합부터 30일 동안 매일 10개씩 발행 예약
WITH ranked_combinations AS (
  SELECT
    lc.id,
    ROW_NUMBER() OVER (ORDER BY lc.search_volume DESC, random()) as rn
  FROM longtail_combinations lc
  WHERE lc.is_published = false
  LIMIT 300  -- 30일 x 10개 = 300개
)
INSERT INTO auto_content_queue (
  combination_id,
  template_id,
  scheduled_date,
  priority,
  status
)
SELECT
  rc.id,
  ct.id,
  CURRENT_DATE + ((rc.rn - 1) / 10)::integer,  -- 하루에 10개씩
  CASE
    WHEN lc.search_volume > 1000 THEN 10
    WHEN lc.search_volume > 500 THEN 5
    ELSE 1
  END,
  'pending'
FROM ranked_combinations rc
JOIN longtail_combinations lc ON rc.id = lc.id
JOIN services s ON lc.service_id = s.id
JOIN service_categories sc ON s.category_id = sc.id
LEFT JOIN content_templates ct ON ct.category_id = sc.id
WHERE ct.id IS NOT NULL;

-- ============================================
-- 4단계: 통계 조회
-- ============================================

-- 생성된 조합 통계
SELECT
  'Total Combinations' as metric,
  COUNT(*) as count
FROM longtail_combinations
UNION ALL
SELECT
  'Published' as metric,
  COUNT(*) as count
FROM longtail_combinations
WHERE is_published = true
UNION ALL
SELECT
  'Pending' as metric,
  COUNT(*) as count
FROM longtail_combinations
WHERE is_published = false
UNION ALL
SELECT
  'High Search Volume (>1000)' as metric,
  COUNT(*) as count
FROM longtail_combinations
WHERE search_volume > 1000
UNION ALL
SELECT
  'Low Competition' as metric,
  COUNT(*) as count
FROM longtail_combinations
WHERE competition = 'low';

-- 카테고리별 조합 수
SELECT
  sc.name as category,
  COUNT(lc.id) as combinations,
  SUM(CASE WHEN lc.is_published THEN 1 ELSE 0 END) as published,
  AVG(lc.search_volume)::integer as avg_search_volume
FROM service_categories sc
LEFT JOIN services s ON sc.id = s.category_id
LEFT JOIN longtail_combinations lc ON s.id = lc.service_id
GROUP BY sc.name
ORDER BY combinations DESC;

-- 지역별 조합 수
SELECT
  l.name as location,
  l.population,
  COUNT(lc.id) as combinations,
  AVG(lc.search_volume)::integer as avg_search_volume
FROM keyword_locations l
LEFT JOIN longtail_combinations lc ON l.id = lc.location_id
WHERE l.level = 'city'
GROUP BY l.name, l.population
ORDER BY combinations DESC
LIMIT 20;

-- 예약된 발행 스케줄
SELECT
  scheduled_date,
  COUNT(*) as scheduled_count,
  AVG(priority)::numeric(10,2) as avg_priority
FROM auto_content_queue
WHERE status = 'pending'
GROUP BY scheduled_date
ORDER BY scheduled_date
LIMIT 30;
