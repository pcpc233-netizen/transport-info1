# 🔧 Vercel 환경 변수 설정 가이드

## 문제 상황
```
Unauthorized: Service key required
```

## 원인
Vercel에 `SUPABASE_SERVICE_ROLE_KEY`가 설정되지 않았습니다.

---

## 해결 방법 (5분)

### 1. Vercel Dashboard 접속
```
https://vercel.com/dashboard
```

### 2. 프로젝트 선택
- `transport-info1` 프로젝트 클릭

### 3. Settings 탭 이동
- 상단 메뉴에서 **Settings** 클릭

### 4. Environment Variables 메뉴
- 왼쪽 사이드바에서 **Environment Variables** 클릭

### 5. 환경 변수 추가

#### 변수 1: SUPABASE_SERVICE_ROLE_KEY
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpYnFkZWNqY2R5ZXl4dGtuYm9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjc1MzA3OSwiZXhwIjoyMDc4MzI5MDc5fQ.Y3xje6vYDXHqbKAMZqU6Lo6e_BrjOpLZWl9NXOFn_IA

Environment: Production, Preview, Development (모두 체크)
```

**"Add" 버튼 클릭**

#### 변수 2: VITE_SUPABASE_URL (확인)
```
Name: VITE_SUPABASE_URL
Value: https://gibqdecjcdyeyxtknbok.supabase.co

Environment: Production, Preview, Development (모두 체크)
```

이미 있으면 건너뛰기. 없으면 추가.

#### 변수 3: VITE_SUPABASE_ANON_KEY (확인)
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpYnFkZWNqY2R5ZXl4dGtuYm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NTMwNzksImV4cCI6MjA3ODMyOTA3OX0.zstQH1P-4pPb2y74LhrH3uSws9I_KkQ55mPRAR0up84

Environment: Production, Preview, Development (모두 체크)
```

이미 있으면 건너뛰기. 없으면 추가.

### 6. 재배포
```
Deployments 탭으로 이동
→ 최신 배포의 ... 메뉴 클릭
→ "Redeploy" 클릭
→ "Redeploy" 버튼 확인
```

또는 자동으로 GitHub push로 재배포됩니다 (이미 완료됨).

---

## 검증 방법

### 1단계: 배포 완료 대기 (2-3분)
Vercel Dashboard > Deployments에서 **Ready** 상태 확인

### 2단계: 관리자 대시보드 접속
```
https://admin.bustime.site
```

### 3단계: 로그인
```
아이디: admin
비밀번호: bustime2025!admin
```

### 4단계: 시스템 탭 클릭

### 5단계: "수동 실행" 버튼 클릭

### 6단계: 성공 확인
```
✅ 팩트 기반 자동화 완료!

🔍 검증된 데이터: XX개
📝 발행된 콘텐츠: XX개

모든 콘텐츠는 실제 교통 데이터를 기반으로 생성되었습니다.
```

---

## 문제 지속 시

### 확인 사항
1. Vercel 환경 변수가 제대로 저장되었는지 확인
2. 재배포가 완료되었는지 확인 (Ready 상태)
3. 브라우저 캐시 삭제 후 재시도 (Ctrl + Shift + R)

### 환경 변수 확인 (Vercel CLI)
```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 환경 변수 확인
vercel env ls
```

### 로그 확인
```
Vercel Dashboard
→ Deployments
→ 최신 배포 클릭
→ Functions 탭
→ /api/automation/run 함수 로그 확인
```

---

## 빠른 참조

### 필요한 환경 변수 (Vercel)
```bash
VITE_SUPABASE_URL=https://gibqdecjcdyeyxtknbok.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Supabase Dashboard
- URL: https://supabase.com/dashboard
- Project: gibqdecjcdyeyxtknbok
- Settings > API > Service Role Key에서 확인 가능

---

## 완료 후 테스트

1. ✅ 로그인 성공
2. ✅ "수동 실행" 버튼 클릭 가능
3. ✅ "Unauthorized" 오류 사라짐
4. ✅ 자동화 실행 성공
5. ✅ 발행된 콘텐츠 확인 가능

---

**📍 현재 상황:**
- GitHub: ✅ 푸시 완료 (SERVICE_ROLE_KEY 포함)
- Vercel: 🔄 재배포 중 (2-3분 소요)
- **필요한 작업: Vercel 환경 변수 설정** ⬆️

위 가이드대로 Vercel Dashboard에서 환경 변수를 설정하면 모든 문제가 해결됩니다!
