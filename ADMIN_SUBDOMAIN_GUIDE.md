# 🎯 관리자 서브도메인 설정 가이드

`admin.bustime.site` - 완전히 분리된 관리자 전용 대시보드

---

## 📋 **목차**

1. [코드 배포하기](#1-코드-배포하기)
2. [Vercel에서 서브도메인 설정](#2-vercel에서-서브도메인-설정)
3. [DNS 설정 (도메인 업체)](#3-dns-설정)
4. [접속 및 테스트](#4-접속-및-테스트)
5. [문제 해결](#5-문제-해결)

---

## ✅ **완료된 작업**

- ✅ 독립된 관리자 앱 생성 (`admin.html`, `AdminApp.tsx`)
- ✅ 전문적인 대시보드 UI (다크 테마)
- ✅ 로그인 시스템
- ✅ 통계 대시보드
- ✅ 서비스 관리 기능
- ✅ Vite 멀티페이지 빌드 설정
- ✅ Vercel 라우팅 설정

---

## 1️⃣ **코드 배포하기**

### 단계 1: GitHub Desktop 열기

1. Windows에서 **GitHub Desktop** 실행
2. 왼쪽에서 **transport-info** 저장소 선택

### 단계 2: 변경사항 확인

수정된 파일 목록:
- ✅ `admin.html` (새 파일)
- ✅ `src/admin-main.tsx` (새 파일)
- ✅ `src/AdminApp.tsx` (새 파일)
- ✅ `src/components/AdminDashboard.tsx` (새 파일)
- ✅ `vite.config.ts` (수정)
- ✅ `vercel.json` (수정)

### 단계 3: 커밋 & 푸시

1. 왼쪽 하단 **요약** 입력:
   ```
   관리자 서브도메인 추가 (admin.bustime.site)
   ```

2. **Commit to main** 버튼 클릭

3. 상단 **Push origin** 버튼 클릭

4. ⏳ **1-2분 대기** (자동 배포)

---

## 2️⃣ **Vercel에서 서브도메인 설정**

### 단계 1: Vercel 프로젝트 접속

1. https://vercel.com 로그인
2. **transport-info** 프로젝트 클릭

### 단계 2: 도메인 추가

1. 상단 탭에서 **Settings** 클릭
2. 왼쪽 메뉴에서 **Domains** 클릭
3. **Add** 버튼 클릭
4. 입력창에 다음 입력:
   ```
   admin.bustime.site
   ```
5. **Add** 버튼 클릭

### 단계 3: DNS 설정 정보 확인

Vercel이 보여주는 정보:

```
DNS 설정 필요:

Type: CNAME
Name: admin
Value: cname.vercel-dns.com
```

**이 정보를 메모하세요!** (다음 단계에서 사용)

---

## 3️⃣ **DNS 설정**

### 어디서 도메인을 구매하셨나요?

#### 📌 **Cafe24 / 가비아 / Hosting.kr**

1. 도메인 관리 페이지 로그인
2. **bustime.site** 선택
3. **DNS 설정** 또는 **레코드 관리** 클릭
4. **새 레코드 추가**:
   - **타입**: CNAME
   - **호스트명**: `admin`
   - **값**: `cname.vercel-dns.com`
   - **TTL**: 3600 (기본값)
5. **저장** 클릭

#### 📌 **Cloudflare**

1. Cloudflare 대시보드 로그인
2. **bustime.site** 선택
3. 왼쪽 메뉴 **DNS** 클릭
4. **Add record** 클릭:
   - **Type**: CNAME
   - **Name**: `admin`
   - **Target**: `cname.vercel-dns.com`
   - **Proxy status**: DNS only (회색 구름)
5. **Save** 클릭

#### 📌 **기타 도메인 업체**

**공통 설정:**
```
Type: CNAME
Host/Name: admin
Points to/Value: cname.vercel-dns.com
TTL: 3600 또는 자동
```

### ⏱️ **DNS 전파 대기**

- **일반적으로**: 5-10분
- **최대**: 48시간 (드물게)

---

## 4️⃣ **접속 및 테스트**

### 테스트 순서

#### 1. 메인 사이트 확인
```
https://bustime.site
→ 일반 사용자용 사이트가 정상 작동
```

#### 2. 관리자 사이트 접속
```
https://admin.bustime.site
→ 로그인 페이지가 나타남
```

#### 3. 로그인
- **비밀번호**: `bustime2025!admin`
- 로그인 성공 시 → 다크 테마 대시보드

#### 4. 기능 테스트
- ✅ 통계 카드 표시
- ✅ 서비스 목록 표시
- ✅ 서울 버스 데이터 수집
- ✅ 새 서비스 추가
- ✅ 서비스 수정/삭제

---

## 5️⃣ **문제 해결**

### 문제 1: "admin.bustime.site에 연결할 수 없습니다"

**원인**: DNS 전파 대기 중

**해결방법**:
1. 5-10분 대기
2. 브라우저 새로고침 (Ctrl+F5)
3. DNS 전파 확인: https://dnschecker.org
   - 입력: `admin.bustime.site`

### 문제 2: "404 Not Found"

**원인**: Vercel 라우팅 설정 오류

**해결방법**:
1. Vercel 대시보드 → **Deployments** 확인
2. 최신 배포가 **Ready** 상태인지 확인
3. **Visit** 버튼으로 직접 테스트

### 문제 3: 관리자 페이지가 메인 페이지처럼 보임

**원인**: 빌드 오류

**해결방법**:
1. GitHub Desktop에서 모든 파일이 푸시되었는지 확인
2. Vercel에서 재배포:
   - **Deployments** → 최신 항목 → **⋯** → **Redeploy**

### 문제 4: 로그인이 안됨

**원인**: Supabase 연결 문제

**해결방법**:
1. `.env` 파일에 Supabase 설정 확인:
   ```
   VITE_SUPABASE_URL=your-url
   VITE_SUPABASE_ANON_KEY=your-key
   ```
2. 브라우저 콘솔(F12) 확인

---

## 📱 **최종 결과**

### ✅ **2개의 완전히 분리된 사이트**

#### 🌐 **일반 사용자 사이트**
```
URL: https://bustime.site
용도: 대중 교통 정보 검색
디자인: 밝은 파란색/흰색
```

#### 🔐 **관리자 전용 사이트**
```
URL: https://admin.bustime.site
용도: 데이터 관리, 통계 확인
디자인: 다크 테마 대시보드
보안: 비밀번호 로그인
```

---

## 🎉 **설정 완료 체크리스트**

- [ ] GitHub에 코드 푸시
- [ ] Vercel 자동 배포 완료 확인
- [ ] Vercel에서 admin.bustime.site 도메인 추가
- [ ] 도메인 업체에서 CNAME 레코드 추가
- [ ] DNS 전파 확인 (5-10분 대기)
- [ ] https://admin.bustime.site 접속 테스트
- [ ] 로그인 테스트
- [ ] 관리자 기능 테스트

---

## 💡 **추가 팁**

### 보안 강화

1. **비밀번호 변경**:
   - `src/components/AdminAuth.tsx` 파일에서 비밀번호 수정

2. **IP 제한** (선택사항):
   - Cloudflare를 사용하는 경우 방화벽 규칙 추가

3. **로그 모니터링**:
   - Vercel Analytics에서 접속 로그 확인

### 성능 최적화

1. **Cloudflare 사용**:
   - CDN 가속
   - DDoS 보호
   - 무료

2. **이미지 최적화**:
   - Vercel Image Optimization 활성화

---

## 📞 **도움이 필요하신가요?**

1. **Vercel 공식 문서**: https://vercel.com/docs/domains
2. **DNS 전파 확인**: https://dnschecker.org
3. **Cloudflare DNS 가이드**: https://developers.cloudflare.com/dns

---

## 🎊 **축하합니다!**

이제 완전히 분리된 관리자 사이트가 준비되었습니다!

- ✅ 전문적인 URL (`admin.bustime.site`)
- ✅ 독립된 디자인 (다크 테마 대시보드)
- ✅ 보안 로그인
- ✅ 통계 및 관리 기능

**메인 사이트와 100% 분리되어 더 이상 헷갈리지 않습니다!**
