# 🚀 Vercel 배포 상세 가이드

## 📋 사전 준비사항
- GitHub 계정 (이미 있음 - transport-info1 저장소)
- 5분 정도의 시간

---

## 1단계: Vercel 계정 생성 및 로그인

### 1-1. Vercel 사이트 접속
1. 브라우저에서 https://vercel.com 접속
2. 화면 우측 상단 **"Sign Up"** 버튼 클릭

### 1-2. GitHub 계정으로 로그인
1. 로그인 화면에서 **"Continue with GitHub"** 버튼 클릭
2. GitHub 로그인 화면이 나오면 로그인
3. "Authorize Vercel" 버튼 클릭 (권한 승인)
4. Vercel 대시보드로 이동됨

---

## 2단계: GitHub 저장소 Import

### 2-1. 새 프로젝트 추가
1. Vercel 대시보드 화면에서 **"Add New..."** 버튼 클릭
2. 드롭다운 메뉴에서 **"Project"** 선택

### 2-2. GitHub 저장소 연결
1. "Import Git Repository" 섹션에서 GitHub 아이콘 클릭
2. 저장소 목록이 보이지 않으면:
   - **"Adjust GitHub App Permissions"** 클릭
   - "Repository access" 섹션에서 **"Only select repositories"** 선택
   - **"Select repositories"** 드롭다운에서 **"transport-info1"** 선택
   - **"Save"** 버튼 클릭
   - Vercel 화면으로 돌아오기

### 2-3. 저장소 Import
1. 저장소 목록에서 **"transport-info1"** 찾기
2. 옆에 있는 **"Import"** 버튼 클릭

---

## 3단계: 프로젝트 설정

### 3-1. 기본 설정 확인
Import 후 나타나는 설정 화면에서:

1. **Project Name**: `transport-info1` (자동 입력됨, 수정 가능)
2. **Framework Preset**: `Vite` (자동 감지됨)
3. **Root Directory**: `./` (기본값 유지)
4. **Build Command**: `npm run build` (자동 입력됨)
5. **Output Directory**: `dist` (자동 입력됨)

모두 기본값 그대로 두면 됩니다!

### 3-2. 환경 변수 설정 (중요!)

화면을 아래로 스크롤하여 **"Environment Variables"** 섹션 찾기:

#### 첫 번째 환경 변수 추가:
1. **"NAME"** 입력란에 정확히 입력:
   ```
   VITE_SUPABASE_URL
   ```

2. **"VALUE"** 입력란에 정확히 입력 (https:// 포함):
   ```
   https://gibqdecjcdyeyxtknbok.supabase.co
   ```

3. **"Add"** 버튼 클릭

#### 두 번째 환경 변수 추가:
1. **"NAME"** 입력란에 정확히 입력:
   ```
   VITE_SUPABASE_ANON_KEY
   ```

2. **"VALUE"** 입력란에 정확히 입력 (한 줄로):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpYnFkZWNqY2R5ZXl4dGtuYm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NTMwNzksImV4cCI6MjA3ODMyOTA3OX0.zstQH1P-4pPb2y74LhrH3uSws9I_KkQ55mPRAR0up84
   ```

3. **"Add"** 버튼 클릭

총 2개의 환경 변수가 추가되어야 합니다!

---

## 4단계: 배포 시작

### 4-1. 배포 실행
1. 모든 설정 확인 후 화면 맨 아래 **"Deploy"** 버튼 클릭
2. 배포 진행 화면으로 이동

### 4-2. 배포 진행 과정
배포는 3단계로 진행됩니다:

1. **Building** (약 2-3분)
   - npm install 실행
   - npm run build 실행
   - 빌드 로그가 실시간으로 표시됨

2. **Deploying** (약 30초)
   - 빌드된 파일을 Vercel 서버에 업로드

3. **Ready** (완료!)
   - 축하 화면과 함께 도메인 주소 표시
   - 예: `https://transport-info1.vercel.app`

### 4-3. 배포 완료
배포가 완료되면:
- 화면 중앙에 큰 **"Visit"** 버튼이 나타남
- 도메인 주소가 표시됨 (클릭 가능)

---

## 5단계: 배포 확인 및 사이트 접속

### 5-1. 사이트 접속
1. **"Visit"** 버튼 클릭 또는 도메인 주소 클릭
2. 새 탭에서 사이트가 열림

### 5-2. 정상 작동 확인
다음 항목들을 확인하세요:

1. **메인 페이지 로딩**
   - "대한민국 교통 · 공공서비스 정보" 타이틀 표시
   - 헤더에 로고와 메뉴 표시

2. **카테고리 표시**
   - "교통정보" 카드
   - "병원/약국" 카드
   - "여권발급" 카드
   - 각 카드에 아이콘과 설명이 표시됨

3. **카테고리 클릭**
   - "교통정보" 카드 클릭
   - 세부 페이지로 이동
   - 검색창과 서비스 목록 표시

모두 정상이면 배포 성공입니다!

### 5-3. 도메인 주소 저장
배포 완료 후 받은 도메인 주소를 메모해두세요:
- 예: `https://transport-info1.vercel.app`
- 예: `https://transport-info1-사용자명.vercel.app`

이 주소가 앞으로 사용할 사이트 주소입니다!

---

## ❌ 문제 해결 가이드

### 배포 실패 시

#### 증상 1: "Build Failed" 에러
**해결 방법:**
1. Vercel 대시보드에서 실패한 배포 클릭
2. **"Building"** 탭 클릭
3. 에러 로그 전체를 복사
4. 저에게 에러 메시지 전달

#### 증상 2: 사이트는 열리는데 빈 화면
**원인:** 환경 변수 설정 오류

**해결 방법:**
1. Vercel 대시보드에서 프로젝트 선택
2. 상단 **"Settings"** 탭 클릭
3. 왼쪽 메뉴에서 **"Environment Variables"** 클릭
4. 환경 변수 2개가 정확히 입력되었는지 확인:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. 잘못된 경우 삭제 후 다시 추가
6. 상단 **"Deployments"** 탭으로 이동
7. 최신 배포 옆 **"..."** 클릭 → **"Redeploy"** 클릭

#### 증상 3: 카테고리 클릭 시 에러
**원인:** 데이터베이스 연결 문제

**해결 방법:**
1. 브라우저 개발자도구 열기 (F12)
2. **"Console"** 탭에서 에러 메시지 확인
3. 에러 메시지 복사해서 저에게 전달

---

## 📱 배포 후 관리

### 자동 배포 설정 (이미 완료됨!)
GitHub에 코드를 푸시하면 자동으로 재배포됩니다:

1. 코드 수정
2. GitHub에 push
3. Vercel이 자동으로 빌드 및 배포
4. 약 3분 후 사이트에 반영

### 배포 히스토리 확인
1. Vercel 대시보드에서 프로젝트 선택
2. **"Deployments"** 탭에서 모든 배포 내역 확인
3. 각 배포마다 고유 URL 제공 (버전 관리 가능)

### 롤백 (이전 버전으로 되돌리기)
1. **"Deployments"** 탭에서 이전 배포 선택
2. **"..."** 버튼 클릭
3. **"Promote to Production"** 클릭
4. 즉시 이전 버전으로 롤백됨

---

## 🎯 배포 완료 후 다음 단계

### 즉시 가능한 작업
1. **Google Search Console 등록**
   - https://search.google.com/search-console
   - 사이트 추가 및 소유권 확인

2. **사이트맵 제출**
   - 도메인/sitemap.xml 주소 등록

3. **소셜 공유 테스트**
   - 카카오톡, 페이스북에 링크 공유
   - 미리보기 정상 표시 확인

### 데이터 수집 시작 (Week 1)
1. **공공 API 키 발급**
   - https://www.data.go.kr 회원가입
   - 버스/병원 API 신청

2. **데이터 수집 실행**
   - AdminPanel에서 수집 함수 실행
   - 100개 버스 데이터 수집

3. **롱테일 페이지 생성**
   - 500개 페이지 자동 생성
   - SEO 최적화 완료

---

## 💡 유용한 팁

### 무료 플랜 제한
- 월 100GB 대역폭 (일 10만 PV 가능)
- 빌드 시간 무제한
- 커스텀 도메인 연결 가능
- HTTPS 자동 적용

### 성능 모니터링
1. Vercel 대시보드에서 **"Analytics"** 탭
2. 방문자 수, 속도, 에러 확인 가능
3. 무료 플랜에서도 기본 통계 제공

### 커스텀 도메인 연결 (선택사항)
나중에 자신의 도메인 연결 가능:
1. 도메인 구매 (예: transport-info.com)
2. Vercel Settings → Domains
3. DNS 설정 (가이드 제공됨)
4. 자동으로 HTTPS 적용

---

## ✅ 체크리스트

배포 전:
- [ ] Vercel 계정 생성
- [ ] GitHub 저장소 연결
- [ ] 환경 변수 2개 입력

배포 후:
- [ ] 사이트 정상 접속 확인
- [ ] 메인 페이지 로딩 확인
- [ ] 카테고리 클릭 작동 확인
- [ ] 도메인 주소 메모

다음 단계:
- [ ] 공공 API 키 발급
- [ ] 데이터 수집 시작
- [ ] Google Search Console 등록

---

## 🆘 도움이 필요하면

1. **스크린샷 공유**
   - 에러 화면 캡처
   - 설정 화면 캡처

2. **에러 로그 복사**
   - 빌드 로그
   - 브라우저 콘솔 에러

3. **정확한 증상 설명**
   - "어떤 버튼을 눌렀을 때"
   - "어떤 에러가 발생했는지"

저에게 알려주시면 바로 해결해드리겠습니다!

---

**이제 VERCEL_DEPLOY_GUIDE.md 파일을 보시고 단계별로 따라하시면 됩니다!**
