# 완전한 설정 가이드

## 🎯 이 가이드의 목적

이 문서는 **Vercel**, **Supabase**, **GitHub**의 모든 설정을 확인하고 누락된 부분을 찾아 수정하는 방법을 안내합니다.

---

## 1️⃣ Vercel 환경변수 확인

### 필수 환경변수 (7개)

Vercel Dashboard → Settings → Environment Variables에서 다음을 확인하세요:

| 변수명 | 값 확인 | 환경 |
|--------|---------|------|
| `VITE_SUPABASE_URL` | `https://gibqdecjcdyeyxtknbok.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (긴 토큰) | 모두 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (긴 토큰) | 모두 |
| `SEOUL_BUS_API_KEY` | `da6a1b3be689e14556c3240efefa1e49cac3f2fb6b19571adb4b58afffc6aa14` | 모두 |
| `CRON_SECRET` | `dhsfkdls!1` | 모두 |
| `OPENAI_API_KEY` | `sk-proj-...` (OpenAI API 키) | 모두 |
| `RESEND_API_KEY` | (선택사항) 이메일 발송용 | 모두 |

### ⚠️ 주의사항

- 각 변수는 **3개 환경** (Production, Preview, Development) 모두에 체크되어야 함
- 값에 **공백이나 따옴표**가 없어야 함
- 변경 후 반드시 **재배포** 필요

---

## 2️⃣ Supabase 설정 확인

### A. Edge Functions 배포 상태

Supabase Dashboard → Edge Functions에서 다음 함수들이 **ACTIVE** 상태인지 확인:

**인증 관련:**
- ✅ `admin-login` - 관리자 로그인
- ✅ `admin-verify-session` - 세션 검증
- ✅ `create-initial-admin` - 초기 관리자 생성

**자동화 관련:**
- ✅ `auto-content-orchestrator` - 자동화 오케스트레이터
- ✅ `daily-automation` - 일일 자동화
- ✅ `generate-gpt-content` - GPT 콘텐츠 생성
- ✅ `generate-longtail-keywords` - 롱테일 키워드 생성
- ✅ `publish-longtail-content` - 콘텐츠 발행

**데이터 수집:**
- ✅ `collect-seoul-buses` - 서울 버스
- ✅ `collect-busan-buses` - 부산 버스
- ✅ `collect-gyeonggi-buses` - 경기 버스
- ✅ `collect-incheon-buses` - 인천 버스

**기타:**
- ✅ `send-alert-email` - 알림 이메일
- ✅ `verify-transport-data` - 데이터 검증

### B. 데이터베이스 테이블 확인

Supabase Dashboard → Table Editor에서 다음 테이블이 있는지 확인:

**인증 테이블:**
- `admin_users` - 관리자 계정
- `admin_sessions` - 세션 정보
- `admin_activity_logs` - 활동 로그

**콘텐츠 테이블:**
- `longtail_keywords` - 롱테일 키워드
- `longtail_content_pages` - 생성된 페이지
- `gpt_generated_content` - GPT 콘텐츠

**데이터 테이블:**
- `bus_routes` - 버스 노선
- `bus_stops` - 정류장
- `bus_arrivals` - 도착 정보
- `automation_logs` - 자동화 로그

### C. RLS (Row Level Security) 정책 확인

각 테이블의 RLS가 활성화되어 있어야 합니다:

```sql
-- 확인 쿼리 (Supabase SQL Editor에서 실행)
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**중요:** `admin_sessions`, `admin_users`, `admin_activity_logs` 테이블은 RLS가 활성화되어 있어야 하지만, **SERVICE_ROLE_KEY**를 사용하면 우회됩니다.

### D. 환경변수 (Supabase Edge Functions용)

Supabase Dashboard → Settings → Edge Functions → Environment Variables:

| 변수명 | 필요 여부 |
|--------|-----------|
| `SUPABASE_URL` | ✅ 자동 설정됨 |
| `SUPABASE_ANON_KEY` | ✅ 자동 설정됨 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ 자동 설정됨 |
| `OPENAI_API_KEY` | ❌ Edge Functions는 Vercel API 경유 |
| `SEOUL_BUS_API_KEY` | ❌ Edge Functions는 Vercel API 경유 |

**참고:** Supabase Edge Functions는 기본 환경변수만 자동 설정되며, 추가 변수는 불필요합니다.

---

## 3️⃣ GitHub 설정 확인

### A. Repository Secrets

GitHub Repository → Settings → Secrets and variables → Actions:

**현재는 GitHub Actions를 사용하지 않으므로 설정 불필요**

### B. Branch Protection

GitHub Repository → Settings → Branches:

- `main` 브랜치에 **Secret Scanning** 활성화됨
- API 키가 포함된 커밋은 자동으로 차단됨

### C. .gitignore 확인

다음 파일들이 `.gitignore`에 포함되어 있는지 확인:

```
.env
.env.local
.env.production
.env.development
```

---

## 4️⃣ 로컬 개발 환경 (.env 파일)

프로젝트 루트의 `.env` 파일:

```bash
# Supabase
VITE_SUPABASE_URL=https://gibqdecjcdyeyxtknbok.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Keys
SEOUL_BUS_API_KEY=da6a1b3be689e14556c3240efefa1e49cac3f2fb6b19571adb4b58afffc6aa14
CRON_SECRET=dhsfkdls!1
OPENAI_API_KEY=sk-proj-...
RESEND_API_KEY=YOUR_RESEND_API_KEY_HERE
```

---

## 5️⃣ 문제 해결 체크리스트

### 401 Unauthorized 오류 발생 시

**1단계: 환경변수 확인**
- [ ] Vercel에 7개 필수 환경변수 모두 설정됨
- [ ] 각 변수가 3개 환경 모두에 체크됨
- [ ] 값에 공백/따옴표 없음

**2단계: 재배포**
- [ ] Vercel Dashboard → Deployments → Redeploy 클릭
- [ ] 3-5분 대기

**3단계: 브라우저 캐시**
- [ ] Ctrl + Shift + R (강력 새로고침)
- [ ] 또는 시크릿 모드에서 테스트

**4단계: 세션 확인**
- [ ] F12 → Console 탭 열기
- [ ] 로그인 후 `Login response` 확인
- [ ] `Verification - token stored correctly: true` 확인

**5단계: 데이터베이스 확인**

Supabase SQL Editor에서 실행:

```sql
-- 최근 세션 확인
SELECT
  LEFT(session_token, 30) as token_preview,
  expires_at,
  expires_at > now() as is_valid,
  created_at
FROM admin_sessions
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;
```

---

## 6️⃣ 디버깅 로그 확인 방법

### 브라우저 콘솔 (F12)

로그인 시:
```
Login response: {status: 200, success: true, hasToken: true}
Storing session token: c38e6862-4730-464b-a...
Verification - token stored correctly: true
```

자동화 실행 시:
```
[SystemMonitoring] Full session token being sent: c38e6862-...
[SystemMonitoring] Token length: 36
POST /api/automation/run 200 (OK)
```

### Vercel 로그

Vercel Dashboard → Deployments → 최신 배포 → Logs:

```
[verifyAdminSession] Starting verification for token: c38e6862-4730-464b-a...
[verifyAdminSession] Query result: {found: true, error: null}
Admin admin triggered automation
```

### Supabase 로그

Supabase Dashboard → Logs → Edge Functions:

- 각 함수 호출 기록
- 에러 메시지
- 실행 시간

---

## 7️⃣ 최종 확인

모든 설정이 완료되었다면:

1. **admin.bustime.site** 접속
2. 아이디/비밀번호로 **로그인**
3. **시스템 모니터링** 탭 이동
4. **수동 실행** 버튼 클릭
5. 성공 메시지 확인

---

## 🆘 여전히 오류가 발생한다면

다음 정보를 수집해주세요:

1. **브라우저 콘솔 로그** (F12 → Console 탭 전체 스크린샷)
2. **Vercel 로그** (최신 배포의 Function 로그)
3. **Supabase 세션 쿼리 결과**:
   ```sql
   SELECT LEFT(session_token, 30), expires_at, created_at
   FROM admin_sessions
   WHERE created_at > now() - interval '10 minutes'
   ORDER BY created_at DESC;
   ```

이 정보로 정확한 원인을 파악할 수 있습니다.
