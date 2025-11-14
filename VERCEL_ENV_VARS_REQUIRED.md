# Vercel 환경변수 설정 필수 가이드

## ⚠️ 중요: 반드시 설정해야 하는 환경변수

Vercel 대시보드 → Settings → Environment Variables에서 다음 변수들을 **모두** 설정해야 합니다.

## 필수 환경변수 목록

### 1. Supabase 연결 (필수)

```
VITE_SUPABASE_URL=https://gibqdecjcdyeyxtknbok.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpYnFkZWNqY2R5ZXl4dGtuYm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NTMwNzksImV4cCI6MjA3ODMyOTA3OX0.zstQH1P-4pPb2y74LhrH3uSws9I_KkQ55mPRAR0up84
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpYnFkZWNqY2R5ZXl4dGtuYm9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjc1MzA3OSwiZXhwIjoyMDc4MzI5MDc5fQ.Y3xje6vYDXHqbKAMZqU6Lo6e_BrjOpLZWl9NXOFn_IA
```

### 2. 공공 API 키 (필수)

```
SEOUL_BUS_API_KEY=da6a1b3be689e14556c3240efefa1e49cac3f2fb6b19571adb4b58afffc6aa14
```

### 3. CRON 보안 (필수)

```
CRON_SECRET=dhsfkdls!1
```

### 4. OpenAI API (콘텐츠 생성용, 필수)

```
OPENAI_API_KEY=<실제 OpenAI API 키를 여기에 입력>
```

**주의:** OpenAI API 키는 별도로 관리 중입니다. 기존 키를 사용하세요.

### 5. Resend API (이메일 발송용, 선택)

```
RESEND_API_KEY=YOUR_RESEND_API_KEY_HERE
```

- 비밀번호 복구 이메일에만 사용
- 없어도 다른 기능은 정상 작동

## 설정 방법

1. Vercel 대시보드 접속
2. 프로젝트 선택
3. **Settings** → **Environment Variables** 클릭
4. 위의 각 변수를 **Name**과 **Value**에 입력
5. **Environment**: `Production`, `Preview`, `Development` 모두 체크
6. **Save** 클릭

## 확인 방법

설정 후 Vercel 대시보드에서:
1. **Settings** → **Environment Variables**
2. 다음 6개 변수가 모두 있는지 확인:
   - ✅ `VITE_SUPABASE_URL`
   - ✅ `VITE_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `SEOUL_BUS_API_KEY`
   - ✅ `CRON_SECRET`
   - ✅ `OPENAI_API_KEY`
   - ⚠️ `RESEND_API_KEY` (선택)

## 재배포 필요

환경변수 변경 후 **반드시 재배포**해야 합니다:
1. **Deployments** 탭
2. 최신 배포 옆 **...** → **Redeploy**
3. 체크박스 선택: **Use existing Build Cache**
4. **Redeploy** 클릭

## 문제 발생 시

401 Unauthorized 오류가 계속 발생한다면:
1. 위 6개 필수 변수가 **모두** 설정되었는지 확인
2. 값에 **공백이나 따옴표**가 없는지 확인
3. 재배포 후 **3-5분** 대기
4. 브라우저 캐시 삭제 (Ctrl + Shift + R)
