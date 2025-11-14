# 프로젝트 핵심 정보

## Git 저장소
- **GitHub Repository**: `pcpc233-netizen/transport-info1`
- **Repository URL**: https://github.com/pcpc233-netizen/transport-info1
- **Default Branch**: `main`
- **Access Token**: `.bolt/GITHUB_TOKEN.md` 파일 참조 (절대 공개 금지!)

## Bolt 작업 환경에서 GitHub 푸시 방법

이 프로젝트는 Bolt 환경에서 작업하고 있으므로, 변경사항을 GitHub에 푸시하려면 다음 명령어를 사용하세요:

```bash
# 1. 저장소 클론
cd /tmp/cc-agent/59952428
git clone https://[TOKEN]@github.com/pcpc233-netizen/transport-info1.git repo-clone

# 2. 프로젝트 파일 복사
cp -r /tmp/cc-agent/59952428/project/* /tmp/cc-agent/59952428/repo-clone/

# 3. Git 설정 및 커밋
cd /tmp/cc-agent/59952428/repo-clone
git config user.email "admin@bustime.site"
git config user.name "BusTime Bot"
git add -A
git commit -m "Update from Bolt"

# 4. 푸시 (Vercel 자동 배포)
git push origin main
```

**토큰은 `.bolt/GITHUB_TOKEN.md` 파일에 저장되어 있습니다.**

## 배포 환경
- **Production URL**: https://bustime.site
- **Admin URL**: https://admin.bustime.site
- **Vercel Project**: 연동됨 (Git push 시 자동 배포)

## Supabase 연결
- **Project URL**: https://gibqdecjcdyeyxtknbok.supabase.co
- **Environment Variables**: `.env` 파일 참조
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## 관리자 계정
- **Default Username**: `admin`
- **초기 비밀번호**: `ADMIN_PASSWORD.md` 파일 참조
- **비밀번호 복구**: 이메일 기반 복구 시스템 구현됨

## 주요 기능
1. **자동화 시스템**
   - 일일 콘텐츠 자동 생성
   - 버스 데이터 수집 (서울, 경기, 인천, 부산)
   - 스케줄 관리 UI (시간/요일 선택)

2. **관리자 대시보드**
   - 분석 (Analytics)
   - 콘텐츠 관리
   - 시스템 모니터링
   - 설정 (자동화 스케줄 포함)

3. **SEO 최적화**
   - 롱테일 키워드 시스템
   - 동적 sitemap 생성
   - 메타 태그 최적화

## 데이터베이스 스키마
주요 테이블:
- `admin_users` - 관리자 계정
- `automation_schedules` - 자동화 스케줄 (CRUD 가능)
- `automation_logs` - 실행 로그
- `longtail_keywords` - SEO 키워드
- `longtail_content_pages` - 생성된 콘텐츠
- `bus_routes`, `bus_stops` - 버스 정보
- `password_recovery_codes` - 비밀번호 복구

## Edge Functions
위치: `supabase/functions/`

주요 함수:
- `admin-login` - 관리자 로그인
- `admin-verify-session` - 세션 검증
- `daily-automation` - 일일 자동화 오케스트레이터
- `collect-seoul-buses` - 서울 버스 수집
- `collect-gyeonggi-buses` - 경기 버스 수집
- `collect-incheon-buses` - 인천 버스 수집
- `collect-busan-buses` - 부산 버스 수집
- `generate-gpt-content` - GPT 콘텐츠 생성
- `publish-longtail-content` - 콘텐츠 발행

## 최근 변경사항 (2025-11-14)
1. ✅ 자동화 스케줄 관리 UI 구현
   - 시간/분 설정
   - 요일 선택 (일~토)
   - Cron 표현식 자동 생성
   - 프리셋 스케줄 (매일 새벽 2시, 평일 9시 등)
   - 활성화/비활성화 토글
   - 수정/삭제 기능

2. ✅ CORS 문제 해결
   - Supabase 직접 호출 제거
   - Edge Function 프록시 사용

3. ✅ Git 저장소 연결
   - GitHub: `pcpc233-netizen/transport-info1`
   - Vercel 자동 배포 설정

## 개발 워크플로우

### 로컬 개발
```bash
npm run dev  # 개발 서버 (자동 실행됨)
npm run build  # 프로덕션 빌드
npm run preview  # 빌드 미리보기
```

### 배포 프로세스
```bash
git add -A
git commit -m "변경 사항 설명"
git push origin main  # Vercel 자동 배포
```

### Edge Function 배포
- 자동: `mcp__supabase__deploy_edge_function` 도구 사용
- 수동: Supabase Dashboard 사용 불가 (도구만 사용)

## 문제 해결

### 배포가 반영 안 될 때
1. Vercel Dashboard → Deployments
2. 최신 배포 → "..." → Redeploy
3. "Use existing Build Cache" 체크 해제
4. Redeploy 클릭

### CORS 오류
- Supabase를 직접 호출하지 말고 Edge Function 사용
- `supabase/functions/` 내 함수 활용

### 자동화가 실행 안 될 때
1. `automation_schedules` 테이블에서 `is_active` 확인
2. Vercel Cron Jobs 설정 확인 (vercel.json)
3. Edge Function 로그 확인

## 중요 파일
- `.env` - 환경 변수 (로컬)
- `.env.production` - 프로덕션 환경 변수
- `vercel.json` - Vercel 설정 (cron, rewrites)
- `PROJECT_INFO.md` - 이 파일 (프로젝트 핵심 정보)
- `ADMIN_PASSWORD.md` - 관리자 비밀번호
- `DEPLOYMENT_GUIDE.md` - 배포 가이드
- `AUTOMATION_GUIDE.md` - 자동화 가이드

## API 키 (환경 변수로 관리)
- 서울 공공데이터 API
- 경기 공공데이터 API
- 인천 공공데이터 API
- 부산 공공데이터 API
- OpenAI API (콘텐츠 생성용)

## 연락처
- **사이트**: https://bustime.site
- **관리자**: https://admin.bustime.site
- **GitHub**: https://github.com/pcpc233-netizen/transport-info1

---

**마지막 업데이트**: 2025-11-14
**작성자**: AI Assistant
**목적**: 프로젝트 컨텍스트 보존 및 빠른 참조
