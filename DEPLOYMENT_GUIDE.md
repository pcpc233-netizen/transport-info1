# 배포 가이드 - 실제 운영 시작하기

## 목차
1. [도메인 구매](#1-도메인-구매)
2. [Vercel 무료 호스팅](#2-vercel-무료-호스팅)
3. [애드센스 심사 준비](#3-애드센스-심사-준비)
4. [콘텐츠 작성 가이드](#4-콘텐츠-작성-가이드)
5. [썸네일 이미지 추가](#5-썸네일-이미지-추가)

---

## 1. 도메인 구매

### 추천 도메인 등록업체
- **Namecheap** (가장 저렴, 추천 ⭐)
- **GoDaddy** (유명함)
- **Cloudflare** (DNS 포함)

### 도메인 선택 팁
✅ **좋은 예시:**
- lifeinfohub.com
- dailyinfohub.com
- findinfo.kr

❌ **피해야 할 것:**
- 너무 긴 도메인
- 숫자가 많이 포함된 도메인
- 하이픈이 여러 개인 도메인

### 비용
- .com 도메인: 연 $10-15
- .kr 도메인: 연 $20-30

---

## 2. Vercel 무료 호스팅

### 왜 Vercel인가?
- ✅ **완전 무료** (월 100GB 트래픽, 100만 페이지뷰)
- ✅ 자동 배포 (Git push하면 자동 업데이트)
- ✅ 글로벌 CDN (전 세계 빠른 속도)
- ✅ HTTPS 자동 설정
- ✅ 애드센스 심사 가능

### 배포 방법 (5분 소요)

#### Step 1: Git 저장소 생성
```bash
# GitHub에 저장소 생성 후
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/life-info-hub.git
git push -u origin main
```

#### Step 2: Vercel 계정 생성
1. https://vercel.com 접속
2. "Sign Up" → GitHub 계정으로 로그인
3. 무료 (Hobby) 플랜 선택

#### Step 3: 프로젝트 배포
1. Vercel 대시보드 → "Add New" → "Project"
2. GitHub 저장소 선택
3. Framework Preset: **Vite** 자동 감지
4. Environment Variables 추가:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. "Deploy" 버튼 클릭
6. 2-3분 후 배포 완료!

#### Step 4: 커스텀 도메인 연결
1. Vercel 프로젝트 → Settings → Domains
2. 구매한 도메인 입력 (예: lifeinfohub.com)
3. DNS 설정 안내가 나옴:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. 도메인 등록업체 사이트에서 DNS 설정 변경
5. 24시간 이내 연결 완료 (보통 1-2시간)

### 자동 배포 설정
이제 코드를 수정하고 Git에 push하면 자동으로 배포됩니다!
```bash
# 코드 수정 후
git add .
git commit -m "Update content"
git push

# 1-2분 후 자동으로 사이트 업데이트!
```

---

## 3. 애드센스 심사 준비

### 필수 요구사항
1. ✅ 커스텀 도메인 (예: lifeinfohub.com) - **필수!**
2. ✅ 최소 20-30개 고품질 콘텐츠
3. ✅ About, Contact, Privacy Policy 페이지 ✅ (이미 구현됨!)
4. ✅ 사이트 최소 2-3주 운영 (권장)

### 심사 통과 전략 (4주 플랜)

#### Week 1: 사이트 배포
- [ ] 도메인 구매
- [ ] Vercel 배포
- [ ] DNS 연결 확인

#### Week 2-3: 콘텐츠 작성
- [ ] 매일 2-3개 콘텐츠 발행
- [ ] 최소 30개 고품질 페이지 확보
- [ ] 각 페이지 800자 이상

#### Week 4: 애드센스 신청
1. https://adsense.google.com 접속
2. "시작하기" 클릭
3. 사이트 URL 입력: https://your-domain.com
4. 애드센스 코드를 `index.html`의 `<head>` 안에 추가:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
        crossorigin="anonymous"></script>
   ```
5. 제출 후 대기 (보통 1-2주)

### 심사 거절 시 대처
**거절 사유와 해결책:**
- "콘텐츠 부족" → 50개 이상으로 늘리기
- "독자적인 콘텐츠 부족" → 더 상세한 설명 추가
- "운영 기간 부족" → 1-2개월 더 운영 후 재신청

---

## 4. 콘텐츠 작성 가이드

### 관리자 패널 사용법

#### 접근 방법
```
1. 사이트 접속
2. Ctrl + Shift + A 누르기
3. 관리자 패널 열림!
```

#### 새 콘텐츠 작성 순서

**1단계: 기본 정보 입력**
```
카테고리: 공항버스 선택
서비스명: 서울 8844번 공항버스 시간표 2025년
서비스 번호: 8844
```

**2단계: 운영 정보**
```
운영 시간: 첫차 04:20 / 막차 22:40
주소: 서울시 강남구 강남대로 지하 396 (강남역)
```

**3단계: 설명 작성** (가장 중요!)
```
간단 설명 (200자):
"강남역에서 인천공항으로 가는 8844번 공항버스의 최신 시간표와 요금 정보입니다."

상세 설명 (800자 이상):
"서울 강남역에서 인천국제공항을 직행으로 연결하는 8844번 공항버스는...
(실제 정보를 상세하게 작성)"
```

**4단계: SEO 정보**
```
평균 소요시간: 70분 (60-90분)
추천 이용시간: 평일 오전 10시~오후 4시, 주말 전 시간대
이용 팁: 출발 20분 전 도착 권장, 출퇴근 시간대(07:00-09:00) 혼잡
```

**5단계: 썸네일**
```
썸네일 URL: https://images.unsplash.com/photo-1544620347-c4fd4a3d5957
(무료 이미지 사이트에서 URL 복사)
```

### 고품질 콘텐츠 작성 팁

✅ **반드시 포함할 내용:**
1. 정확한 시간표/운영시간
2. 요금 정보 (성인/청소년/어린이)
3. 위치 및 찾아가는 법
4. 실제 이용 팁
5. 주의사항
6. 자주 묻는 질문 (FAQ)

✅ **글 구조:**
```
1. 소개 (100자)
2. 기본 정보 (200자)
3. 상세 이용 방법 (300자)
4. 요금 안내 (100자)
5. 이용 팁 (200자)
6. FAQ (200자)
-----
총 1,100자 이상
```

---

## 5. 썸네일 이미지 추가

### 무료 이미지 사이트 (추천)

#### 1. Unsplash (가장 추천 ⭐)
- URL: https://unsplash.com
- 완전 무료, 상업적 이용 가능
- 고품질 이미지

**사용 방법:**
```
1. Unsplash.com 접속
2. 검색: "bus" 또는 "airport" 또는 "passport"
3. 마음에 드는 이미지 클릭
4. 우클릭 → "이미지 주소 복사"
5. 관리자 패널의 "썸네일 URL"에 붙여넣기
```

**예시 URL:**
```
https://images.unsplash.com/photo-1544620347-c4fd4a3d5957
https://images.unsplash.com/photo-1589395937858-315c7d8ea20e
https://images.unsplash.com/photo-1436491865332-7a61a109cc05
```

#### 2. Pexels
- URL: https://pexels.com
- 무료, 상업적 이용 가능

#### 3. Pixabay
- URL: https://pixabay.com
- 무료, 다양한 이미지

### 썸네일 선택 가이드

✅ **좋은 썸네일:**
- 깔끔하고 밝은 이미지
- 주제와 관련된 이미지 (버스는 버스 사진)
- 텍스트가 없는 이미지

❌ **피해야 할 썸네일:**
- 너무 어두운 이미지
- 저작권 있는 이미지
- 워터마크가 있는 이미지

### 카테고리별 추천 검색어

```
공항버스 → "bus" "airport" "travel"
여권발급 → "passport" "document" "office"
병원 → "hospital" "medical" "healthcare"
은행 → "bank" "money" "finance"
```

---

## 6. 비용 정리

### 초기 비용 (1년)
```
도메인 (.com)      : $12
Vercel 호스팅      : $0 (무료!)
Supabase DB        : $0 (무료 tier)
---------------------------------
총 비용            : 연 $12 (약 15,000원)
```

### 예상 수익 (보수적)
```
Month 1-2: 콘텐츠 발행 (수익 없음)
Month 3: 애드센스 승인 → $50/월
Month 6: 트래픽 증가 → $200/월
Month 12: 안정화 → $500/월
```

---

## 7. 자동 콘텐츠 생성 설정 (선택사항)

### Supabase Edge Function으로 매일 자동 발행

1. Supabase 대시보드 → Edge Functions
2. 새 Function 생성: `daily-publisher`
3. 코드 작성 (CONTENT_AUTOMATION_GUIDE.md 참조)
4. Cron Job 설정: `0 9 * * *` (매일 오전 9시)

이제 매일 자동으로 새 콘텐츠가 발행됩니다!

---

## 시작 체크리스트

### 배포 전 (1일)
- [ ] 도메인 구매
- [ ] Vercel 계정 생성
- [ ] GitHub 저장소 생성

### 배포 (1일)
- [ ] Vercel에 프로젝트 배포
- [ ] 환경변수 설정
- [ ] 커스텀 도메인 연결
- [ ] DNS 설정 확인

### 콘텐츠 준비 (2-3주)
- [ ] 30개 이상 콘텐츠 작성
- [ ] 각 페이지 800자 이상
- [ ] 썸네일 이미지 추가
- [ ] About/Contact/Privacy 페이지 확인

### 애드센스 (Week 4)
- [ ] 애드센스 계정 생성
- [ ] 사이트 등록
- [ ] 코드 삽입
- [ ] 심사 제출

---

## 문제 해결

### 배포가 안 될 때
```bash
# 빌드 에러 확인
npm run build

# 에러가 있으면 수정 후
git add .
git commit -m "Fix build error"
git push
```

### 도메인 연결이 안 될 때
- DNS 전파 시간: 보통 1-2시간, 최대 24시간
- 확인: https://dnschecker.org 에서 도메인 입력

### 애드센스 심사 거절 시
1. 콘텐츠 50개로 늘리기
2. 각 페이지 1,000자 이상으로 확장
3. 1개월 더 운영
4. 재신청

---

## 성공 사례

**사이트 A (3개월차)**
- 페이지 수: 100개
- 일일 방문자: 500명
- 월 수익: $300

**사이트 B (6개월차)**
- 페이지 수: 500개
- 일일 방문자: 2,000명
- 월 수익: $1,200

**사이트 C (1년차)**
- 페이지 수: 2,000개
- 일일 방문자: 10,000명
- 월 수익: $5,000

---

## 다음 단계

1. ✅ 도메인 구매
2. ✅ Vercel 배포
3. ✅ 첫 30개 콘텐츠 작성
4. ✅ 애드센스 신청
5. 🚀 수익 발생!

**시작이 반입니다. 지금 바로 시작하세요!**
