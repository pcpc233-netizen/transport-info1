# 🔧 문제 해결 가이드

## 📋 목차
1. [자동화 시스템 문제](#자동화-시스템-문제)
2. [관리자 대시보드 문제](#관리자-대시보드-문제)
3. [데이터 표시 문제](#데이터-표시-문제)
4. [Edge Function 문제](#edge-function-문제)

---

## 자동화 시스템 문제

### ❌ 콘텐츠가 발행되지 않음 (0건)

**증상:**
- "수동 실행" 버튼을 눌렀는데 0건 발행됨
- 실행 로그가 표시되지 않음

**원인:**
1. Edge Function이 제대로 배포되지 않음
2. 데이터베이스 RLS 정책 문제
3. 필요한 데이터가 없음

**해결 방법:**

#### 1. Edge Function 확인
```bash
# Supabase 대시보드에서 확인
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. Edge Functions 메뉴
4. 다음 함수들이 있는지 확인:
   - publish-longtail-content
   - auto-content-orchestrator
```

#### 2. 데이터 확인
```sql
-- 미발행 콘텐츠 조합 확인
SELECT COUNT(*) FROM longtail_combinations WHERE is_published = false;
-- 결과: 371,612개 이상이어야 함

-- 서비스 데이터 확인
SELECT COUNT(*) FROM services WHERE is_active = true;
-- 결과: 100개 이상이어야 함

-- 키워드 데이터 확인
SELECT COUNT(*) FROM keyword_locations;
SELECT COUNT(*) FROM keyword_actions;
-- 결과: 각각 50개 이상이어야 함
```

#### 3. 직접 실행 테스트
```bash
# publish-longtail-content 직접 호출
curl -X POST \
  'https://gibqdecjcdyeyxtknbok.supabase.co/functions/v1/publish-longtail-content?limit=5' \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json"
```

#### 4. 로그 확인
```sql
-- Edge Function 로그 확인 (Supabase 대시보드)
-- Edge Functions > publish-longtail-content > Logs

-- 데이터베이스 로그 확인
SELECT * FROM automation_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 관리자 대시보드 문제

### ❌ 스케줄, 로그, 상태가 표시되지 않음

**증상:**
- "시스템" 탭에서 모든 섹션이 비어있음
- 데이터는 있지만 UI에 표시 안됨

**원인:**
- RLS (Row Level Security) 정책으로 인해 anon 키로 데이터 읽기 불가

**해결 완료:**
✅ 2025-11-13: RLS 정책 수정됨
- anon 롤에 읽기 권한 부여
- 관리자 세션 검증은 Edge Function에서 수행

**확인 방법:**
```sql
-- RLS 정책 확인
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('automation_schedules', 'automation_logs');

-- 예상 결과:
-- automation_schedules | Anyone can view automation schedules | SELECT
-- automation_logs | Anyone can view automation logs | SELECT
```

**여전히 안 보인다면:**
1. 브라우저 캐시 완전 삭제 (Ctrl+Shift+Del)
2. 시크릿 모드로 재접속
3. 개발자 도구 (F12) > Console 탭에서 오류 확인

---

## 데이터 표시 문제

### ❌ 분석 탭에서 조회수가 0으로 표시됨

**증상:**
- 총 조회수: 0
- 순 방문자: 0
- 인기 페이지가 비어있음

**원인:**
1. 페이지 추적이 아직 활성화되지 않음
2. 데이터가 아직 수집되지 않음

**해결 방법:**

#### 1. 페이지 추적 활성화 확인
```typescript
// 메인 페이지에 추적 코드가 있는지 확인
// src/components/LongtailPage.tsx 또는 ServiceDetail.tsx

import { usePageTracking } from '../lib/usePageTracking';

// 컴포넌트 내부에서
usePageTracking({
  pageType: 'longtail',
  pageId: 'page-id',
  pageUrl: window.location.pathname,
  pageTitle: document.title,
});
```

#### 2. 테스트 데이터 삽입
```sql
-- 테스트 페이지뷰 삽입
SELECT record_page_view(
  'longtail',
  'test-page-1',
  '/test-page',
  '테스트 페이지',
  'visitor_123',
  'session_456',
  'direct'
);

-- 확인
SELECT * FROM page_views ORDER BY created_at DESC LIMIT 5;
SELECT * FROM page_analytics_summary ORDER BY date DESC LIMIT 5;
```

#### 3. 수동으로 통계 업데이트
```sql
-- 오늘 통계 집계
INSERT INTO page_analytics_summary (
  page_type, page_id, page_url, page_title,
  total_views, unique_visitors, date
)
SELECT
  page_type,
  page_id,
  page_url,
  page_title,
  COUNT(*) as total_views,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  CURRENT_DATE as date
FROM page_views
WHERE viewed_at >= CURRENT_DATE
GROUP BY page_type, page_id, page_url, page_title
ON CONFLICT (page_type, page_id, date) DO UPDATE SET
  total_views = EXCLUDED.total_views,
  unique_visitors = EXCLUDED.unique_visitors;
```

### ❌ 콘텐츠 관리 탭에서 검색이 안됨

**증상:**
- 검색어를 입력해도 결과가 없음
- 필터가 작동하지 않음

**원인:**
- longtail_content_pages 테이블에 데이터가 없음

**해결 방법:**
```sql
-- 콘텐츠 데이터 확인
SELECT COUNT(*) FROM longtail_content_pages;

-- 0개라면 콘텐츠 발행 필요
-- 관리자 대시보드 > 시스템 > 수동 실행
```

---

## Edge Function 문제

### ❌ Edge Function 호출 시 타임아웃

**증상:**
- 함수 실행이 멈춤
- 응답이 없음

**원인:**
- 복잡한 쿼리로 인한 시간 초과
- 데이터가 너무 많음

**해결 방법:**

#### 1. 배치 크기 줄이기
```bash
# 20개 대신 5개씩 발행
curl -X POST \
  'https://gibqdecjcdyeyxtknbok.supabase.co/functions/v1/publish-longtail-content?limit=5'
```

#### 2. 인덱스 추가
```sql
-- 자주 조회하는 컬럼에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_longtail_is_published
ON longtail_combinations(is_published, search_volume DESC);

CREATE INDEX IF NOT EXISTS idx_services_active
ON services(is_active);
```

#### 3. 데이터베이스 연결 확인
```sql
-- 활성 연결 확인
SELECT count(*) FROM pg_stat_activity;

-- 느린 쿼리 확인
SELECT query, state, wait_event_type
FROM pg_stat_activity
WHERE state != 'idle'
  AND query NOT LIKE '%pg_stat_activity%';
```

### ❌ CORS 오류

**증상:**
```
Access to fetch at '...' has been blocked by CORS policy
```

**원인:**
- Edge Function에 CORS 헤더가 누락됨

**해결 완료:**
✅ 모든 Edge Function에 CORS 헤더 추가됨
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};
```

---

## 일반적인 문제

### ❌ 로그인이 안됨

**해결:**
```
아이디: admin
비밀번호: bustime2025!admin
```

공백 없이 정확히 입력하세요!

### ❌ 배포 후 변경사항이 반영되지 않음

**해결:**
1. Vercel 대시보드 확인 (배포 완료됐는지)
2. 브라우저 캐시 삭제 (Ctrl+F5)
3. 5분 정도 대기 (CDN 캐시)

### ❌ Supabase 연결 오류

**해결:**
```sql
-- 프로젝트 상태 확인
-- Supabase 대시보드 > Settings > General
-- Status: Active 확인

-- API 키 확인
-- Settings > API
-- anon public key 복사
```

---

## 긴급 지원

### 1단계: 로그 확인
```sql
-- 최근 오류 확인
SELECT * FROM automation_logs
WHERE status IN ('failed', 'error', 'partial_success')
ORDER BY created_at DESC
LIMIT 10;
```

### 2단계: Edge Function 재배포
```bash
# Supabase 대시보드에서:
1. Edge Functions 메뉴
2. 문제가 있는 함수 선택
3. "Redeploy" 버튼 클릭
```

### 3단계: 데이터베이스 롤백
```sql
-- 마지막 마이그레이션 이전 상태로 롤백 (신중하게!)
-- Supabase 대시보드 > Database > Migrations
```

---

## 성능 최적화

### 느린 쿼리 최적화
```sql
-- 쿼리 실행 계획 확인
EXPLAIN ANALYZE
SELECT * FROM longtail_combinations
WHERE is_published = false
LIMIT 20;

-- 필요한 인덱스 추가
CREATE INDEX idx_optimal_query
ON longtail_combinations(is_published, search_volume DESC);
```

### 데이터베이스 청소
```sql
-- 오래된 로그 삭제 (30일 이상)
DELETE FROM automation_logs
WHERE created_at < NOW() - INTERVAL '30 days';

-- 오래된 페이지뷰 삭제 (90일 이상)
DELETE FROM page_views
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 체크리스트

배포 전 확인:
- [ ] Edge Functions 모두 배포됨
- [ ] RLS 정책 올바르게 설정됨
- [ ] 환경 변수 설정됨
- [ ] 테스트 데이터 삽입됨
- [ ] 로컬에서 빌드 성공

문제 발생 시:
- [ ] 브라우저 콘솔 확인 (F12)
- [ ] Supabase 로그 확인
- [ ] Vercel 배포 로그 확인
- [ ] 데이터베이스 쿼리 테스트
- [ ] Edge Function 로그 확인

---

**💡 팁: 문제를 찾을 수 없다면**

1. Supabase 대시보드의 Edge Functions 로그를 먼저 확인하세요
2. 브라우저 개발자 도구의 Network 탭에서 API 호출 상태를 확인하세요
3. 데이터베이스에 직접 SQL을 실행해서 데이터를 확인하세요

**🚀 이제 모든 시스템이 정상 작동합니다!**
