# 🚀 bustime.site 프로덕션 자동화 시스템 가이드

## 📋 목차
1. [시스템 개요](#시스템-개요)
2. [핵심 기능](#핵심-기능)
3. [아키텍처](#아키텍처)
4. [보안 구조](#보안-구조)
5. [데이터 검증](#데이터-검증)
6. [알림 시스템](#알림-시스템)
7. [사용 가이드](#사용-가이드)
8. [문제 해결](#문제-해결)

---

## 시스템 개요

bustime.site의 자동화 시스템은 **팩트 기반 콘텐츠 발행**을 보장하는 프로덕션 레벨 인프라입니다.

### 핵심 원칙
✅ **팩트 기반**: 실제 교통 API 데이터만 사용
✅ **보안 우선**: Service Role Key로만 접근 가능
✅ **자동 알림**: 모든 오류를 pcpc233@gmail.com로 전송
✅ **CORS 해결**: 백엔드 프록시를 통한 안전한 호출

---

## 핵심 기능

### 1. 팩트 기반 데이터 검증
- 서울시 버스 API를 통한 실시간 노선 정보 검증
- 유효하지 않은 데이터는 절대 발행하지 않음
- `data_verified` 플래그로 검증 상태 추적

### 2. 3단계 자동화 프로세스
```
Step 1: 데이터 검증 (verify-transport-data)
  → 50개 조합 검증
  → 서울시 버스 API 호출
  → data_verified = true로 마킹

Step 2: 콘텐츠 발행 (publish-longtail-content)
  → 검증된 조합만 선택
  → 중복 방지 (slug 체크)
  → Idempotent 처리

Step 3: 로그 기록 및 알림
  → automation_logs 테이블에 상세 기록
  → 이상치 탐지
  → pcpc233@gmail.com로 알림 발송
```

### 3. 보안 구조
- ❌ 브라우저 → Supabase Edge Function (직접 호출 불가)
- ✅ 브라우저 → admin.bustime.site/api → Supabase Edge Function

```
사용자
  ↓ [세션 토큰]
/api/automation/run (Vercel Serverless)
  ↓ [Service Role Key]
Supabase Edge Functions
  ↓
Database
```

### 4. 실시간 알림 시스템
**알림 수신:** pcpc233@gmail.com

**알림 조건:**
- 🚨 콘텐츠 발행 0건
- ⚠️ 발행률 30% 미만
- 💥 치명적 오류 발생
- 🔍 데이터 검증 실패율 50% 초과
- 📊 이상치 탐지 (편차 70% 이상)

---

## 아키텍처

### 데이터베이스 테이블

#### longtail_combinations
```sql
- data_verified: boolean (검증 완료 여부)
- verification_checked_at: timestamptz (검증 시각)
- verification_errors: jsonb (검증 오류 목록)
- status: text (queued/verifying/verified/generating/published/failed)
```

#### automation_logs
```sql
- log_type: text (작업 유형)
- status: text (success/partial_success/failed)
- details: jsonb (실행 세부사항)
- anomaly_detected: boolean (이상치 탐지)
- anomaly_details: jsonb (이상치 상세)
```

#### alert_email_queue
```sql
- recipient: text (수신자)
- subject: text (제목)
- body: text (본문)
- priority: text (high/normal/low)
- sent: boolean (발송 여부)
```

#### data_validation_logs
```sql
- validation_type: text (검증 유형)
- source_type: text (소스 유형)
- is_valid: boolean (유효성)
- validation_errors: jsonb (오류 목록)
- api_response: jsonb (API 응답)
```

### Edge Functions

#### 1. verify-transport-data
**목적:** 실제 교통 데이터 검증

**인증:** Service Role Key 필수

**작업:**
- 서울시 버스 API 호출
- 노선 정보 존재 여부 확인
- data_validation_logs 기록
- longtail_combinations 업데이트

**사용법:**
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/verify-transport-data" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 50}'
```

#### 2. publish-longtail-content
**목적:** 검증된 데이터만 발행

**인증:** Service Role Key 필수

**특징:**
- data_verified = true 필터링
- slug 중복 체크
- Idempotent 처리
- 자동 알림 발송

**사용법:**
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/publish-longtail-content?limit=20" \
  -H "Authorization: Bearer ${SERVICE_KEY}"
```

#### 3. auto-content-orchestrator
**목적:** 전체 자동화 오케스트레이션

**인증:** Service Role Key 필수

**프로세스:**
1. verify-transport-data 호출 (50개)
2. publish-longtail-content 호출 (20개)
3. 로그 기록 및 이상치 탐지
4. 알림 발송

#### 4. send-alert-email
**목적:** 알림 이메일 큐잉 및 발송

**인증:** Service Role Key 필수

**기능:**
- alert_email_queue에 저장
- Resend API 통합 (설정 시)
- 재시도 로직

---

## 보안 구조

### 1. 백엔드 API 프록시
**위치:** `/api/automation/run.ts`

**역할:**
- 관리자 세션 검증
- Service Key 보호 (브라우저 노출 방지)
- CORS 문제 해결
- 활동 로그 기록

**플로우:**
```
1. 브라우저에서 /api/automation/run 호출
2. localStorage의 admin_session_token 전송
3. 백엔드가 admin_sessions 테이블에서 검증
4. 검증 성공 시 Service Key로 Edge Function 호출
5. 결과를 브라우저에 반환
```

### 2. 인증 레이어
- **Level 1:** 브라우저 → 백엔드 (세션 토큰)
- **Level 2:** 백엔드 → Edge Function (Service Role Key)
- **Level 3:** Edge Function → Database (RLS)

### 3. 세션 관리
```typescript
// 로그인 시
localStorage.setItem('admin_session_token', token);

// API 호출 시
headers: {
  'Authorization': `Bearer ${sessionToken}`
}

// 만료 시 자동 로그아웃
if (response.status === 401) {
  localStorage.removeItem('admin_session_token');
  window.location.href = '/admin.html';
}
```

---

## 데이터 검증

### 검증 프로세스

#### 1. 조합 선택
```sql
SELECT * FROM longtail_combinations
WHERE data_verified = false
  AND verification_checked_at IS NULL
LIMIT 50;
```

#### 2. API 검증
```typescript
// 서울시 버스 API 호출
const response = await fetch(
  `http://ws.bus.go.kr/api/rest/busRouteInfo/getBusRouteList?` +
  `serviceKey=${API_KEY}&strSrch=${routeNumber}`
);

// XML 파싱 및 검증
if (xml.includes('<busRouteNm>')) {
  // 유효한 노선
  validation.isValid = true;
} else {
  // 유효하지 않은 노선
  validation.isValid = false;
}
```

#### 3. 결과 저장
```sql
-- data_validation_logs에 기록
INSERT INTO data_validation_logs (
  validation_type,
  source_id,
  is_valid,
  validation_errors,
  api_response
) VALUES (...);

-- longtail_combinations 업데이트
UPDATE longtail_combinations
SET data_verified = true,
    status = 'verified',
    verification_checked_at = NOW()
WHERE id = ?;
```

### 검증 실패 처리
- ❌ 발행 큐에서 제외
- 📝 validation_errors에 이유 기록
- 🔄 재검증 가능 (verification_checked_at = null로 재설정)

---

## 알림 시스템

### 알림 유형

#### 1. 치명적 오류
**제목:** 💥 [bustime.site] 치명적 오류

**조건:**
- Edge Function 실행 중 예외 발생
- 데이터베이스 연결 실패
- 예상치 못한 시스템 오류

**내용:**
- 오류 메시지
- 스택 트레이스
- 발생 시각
- 영향받은 리소스

#### 2. 콘텐츠 발행 0건
**제목:** 🚨 [bustime.site] 콘텐츠 발행 0건

**조건:**
- 검증된 조합이 없음
- 모든 발행 시도가 실패
- 중복 체크로 인한 모든 건 스킵

**조치:**
1. 검증되지 않은 조합 수 확인
2. verify-transport-data 실행
3. 데이터베이스 상태 점검

#### 3. 발행률 저하
**제목:** ⚠️ [bustime.site] 콘텐츠 발행률 저하

**조건:**
- 발행된 콘텐츠 < 목표의 30%

**예시:**
- 목표: 20개
- 실제: 5개
- 발행률: 25%

#### 4. 이상치 탐지
**제목:** ⚠️ [bustime.site] 자동화 이상치 탐지

**조건:**
- 편차율 70% 초과
- `|actual - expected| / expected > 0.7`

**예시:**
- 예상: 20개
- 실제: 2개
- 편차: 90%

#### 5. 데이터 검증 경고
**제목:** ⚠️ [bustime.site] 데이터 검증 경고

**조건:**
- 검증 실패율 50% 초과

**조치:**
1. 서울시 버스 API 상태 확인
2. API 키 유효성 검증
3. 네트워크 문제 점검

### 알림 설정

#### Resend API 설정 (선택사항)
```bash
# Supabase Dashboard > Settings > Edge Functions > Secrets
RESEND_API_KEY=re_...

# 또는 Supabase CLI
supabase secrets set RESEND_API_KEY=re_...
```

설정되지 않으면:
- alert_email_queue에 저장만 됨
- 수동으로 확인 가능
- 추후 배치 발송 가능

---

## 사용 가이드

### 관리자 대시보드에서 수동 실행

#### 1. 로그인
```
URL: https://admin.bustime.site
아이디: admin
비밀번호: bustime2025!admin
```

#### 2. 시스템 탭으로 이동
- 상단 네비게이션에서 "시스템" 클릭

#### 3. 수동 실행
- "수동 실행" 버튼 클릭
- 10-30초 대기
- 결과 알림 확인

**예상 결과:**
```
✅ 팩트 기반 자동화 완료!

🔍 검증된 데이터: 45개
📝 발행된 콘텐츠: 18개

모든 콘텐츠는 실제 교통 데이터를 기반으로 생성되었습니다.
```

#### 4. 로그 확인
- "실행 로그" 섹션에서 방금 실행한 로그 확인
- 발행 건수, 성공/실패 상태, 타임스탬프 표시

### Supabase Dashboard에서 직접 실행

#### 1. Edge Function 실행
```
1. Supabase Dashboard 접속
2. Edge Functions 메뉴
3. auto-content-orchestrator 선택
4. "Invoke" 버튼 클릭
5. Authorization: Bearer [SERVICE_KEY] 입력
6. 실행
```

#### 2. 로그 확인
```sql
-- 최근 로그 확인
SELECT *
FROM automation_logs
ORDER BY created_at DESC
LIMIT 10;

-- 발행된 콘텐츠 확인
SELECT *
FROM longtail_content_pages
WHERE published_at > NOW() - INTERVAL '1 hour'
ORDER BY published_at DESC;
```

### Cron 자동 실행 설정

#### Vercel Cron (권장)
```json
// vercel.json에 추가
{
  "crons": [
    {
      "path": "/api/cron/daily-automation",
      "schedule": "0 2 * * *"
    }
  ]
}
```

#### Supabase Cron
```sql
-- pg_cron 확장 활성화 (Pro Plan 필요)
SELECT cron.schedule(
  'daily-automation',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gibqdecjcdyeyxtknbok.supabase.co/functions/v1/auto-content-orchestrator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    )
  );
  $$
);
```

---

## 문제 해결

### CORS 오류
**증상:**
```
Access to fetch at '...' has been blocked by CORS policy
```

**원인:**
- 브라우저에서 Supabase Edge Function 직접 호출

**해결:**
✅ SystemMonitoring 컴포넌트가 `/api/automation/run` 사용하는지 확인
✅ vercel.json에 API 라우트 설정 확인

### 인증 실패
**증상:**
```
401 Unauthorized: Service key required
```

**원인:**
- Service Role Key 누락 또는 잘못된 키

**해결:**
```bash
# .env 파일 확인
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Vercel 환경 변수 확인
vercel env pull
```

### 콘텐츠 발행 0건
**증상:**
- 자동화 실행했는데 0개 발행됨

**원인:**
1. 검증된 조합이 없음
2. 모두 중복 slug

**해결:**
```sql
-- 1. 미검증 조합 확인
SELECT COUNT(*) FROM longtail_combinations
WHERE data_verified = false;

-- 2. 검증 실행
-- Supabase Dashboard > Edge Functions > verify-transport-data > Invoke

-- 3. 검증된 조합 확인
SELECT COUNT(*) FROM longtail_combinations
WHERE data_verified = true AND is_published = false;

-- 4. 다시 발행 시도
```

### API 타임아웃
**증상:**
- 서울시 버스 API 호출 실패

**원인:**
- API 서버 장애
- 네트워크 문제
- Rate limit 초과

**해결:**
1. API 상태 확인: http://data.seoul.go.kr
2. 재시도 간격 조정 (200ms → 500ms)
3. 배치 크기 줄이기 (50개 → 20개)

### 이메일 알림 미수신
**증상:**
- 오류 발생했는데 이메일이 오지 않음

**원인:**
- RESEND_API_KEY 미설정
- alert_email_queue에만 저장됨

**해결:**
```sql
-- 큐에 쌓인 알림 확인
SELECT * FROM alert_email_queue
WHERE sent = false
ORDER BY created_at DESC;

-- Resend API 설정 후 수동 재발송 가능
```

---

## 모니터링 쿼리

### 시스템 상태 확인
```sql
-- 오늘 발행된 콘텐츠 수
SELECT COUNT(*) as today_published
FROM longtail_content_pages
WHERE DATE(published_at) = CURRENT_DATE;

-- 검증 대기 중인 조합
SELECT COUNT(*) as pending_verification
FROM longtail_combinations
WHERE data_verified = false
  AND verification_checked_at IS NULL;

-- 최근 자동화 실행 상태
SELECT
  log_type,
  status,
  details->>'total_published' as published,
  anomaly_detected,
  created_at
FROM automation_logs
ORDER BY created_at DESC
LIMIT 5;

-- 발송 대기 중인 알림
SELECT COUNT(*) as pending_alerts
FROM alert_email_queue
WHERE sent = false;
```

### 성능 지표
```sql
-- 검증 성공률
SELECT
  ROUND(
    COUNT(*) FILTER (WHERE data_verified = true) * 100.0 /
    NULLIF(COUNT(*), 0), 2
  ) as verification_success_rate
FROM longtail_combinations
WHERE verification_checked_at IS NOT NULL;

-- 평균 발행 속도 (최근 7일)
SELECT
  AVG(
    (details->>'total_published')::int
  ) as avg_daily_published
FROM automation_logs
WHERE log_type = 'daily_automation'
  AND created_at > NOW() - INTERVAL '7 days';
```

---

## 환경 변수

### 필수 환경 변수
```bash
# Supabase
VITE_SUPABASE_URL=https://gibqdecjcdyeyxtknbok.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 서울시 열린 데이터 광장
SEOUL_BUS_API_KEY=your_api_key

# 이메일 알림 (선택사항)
RESEND_API_KEY=re_...
```

### Vercel 설정
```bash
# Production
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SEOUL_BUS_API_KEY
vercel env add RESEND_API_KEY

# Development
vercel env add SUPABASE_SERVICE_ROLE_KEY development
```

---

## 체크리스트

### 배포 전 확인
- [ ] 모든 Edge Function 배포됨
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 환경 변수 설정됨
- [ ] API 라우트 테스트 완료
- [ ] 세션 인증 작동 확인

### 운영 중 정기 확인 (매일)
- [ ] automation_logs 확인
- [ ] alert_email_queue 확인
- [ ] 발행된 콘텐츠 수 확인
- [ ] 이메일 알림 수신 확인

### 월별 유지보수
- [ ] 오래된 로그 아카이빙
- [ ] 성능 지표 분석
- [ ] 검증 실패 패턴 분석
- [ ] API 키 갱신 확인

---

## 지원

### 문제 발생 시
1. 이메일 알림 확인 (pcpc233@gmail.com)
2. Supabase Dashboard 로그 확인
3. 이 가이드의 문제 해결 섹션 참조
4. 데이터베이스 상태 쿼리 실행

### 연락처
- 알림 이메일: pcpc233@gmail.com
- 관리자 대시보드: https://admin.bustime.site

---

**🎉 팩트 기반 자동화 시스템 구축 완료!**

모든 콘텐츠는 실제 교통 데이터를 검증한 후에만 발행되며,
문제 발생 시 즉시 알림이 전송됩니다.
