# 🤖 매일 자동 콘텐츠 발행 시스템 설정 가이드

## ✅ 완료된 설정

### 1. **자동화 Edge Function 배포 완료**
- `scheduled-daily-content` Function 배포됨
- 5개 카테고리 순환 로직 구현
- 5분 간격 발행 스케줄링
- 에러 이메일 알림 시스템

### 2. **Vercel Cron Job 설정 완료**
- `vercel.json`에 cron 스케줄 추가됨
- 매일 새벽 3시 (KST) 자동 실행

---

## 🔧 추가로 해야 할 설정

### **Vercel 환경 변수 설정**

Vercel 대시보드에서 다음 환경 변수를 추가해야 합니다:

1. **Vercel 프로젝트 설정 페이지 이동**
   ```
   https://vercel.com/[your-username]/[project-name]/settings/environment-variables
   ```

2. **환경 변수 추가**

   | 변수명 | 값 | 설명 |
   |--------|-----|------|
   | `CRON_SECRET` | 랜덤 문자열 생성 | Cron Job 보안 토큰 |
   | `VITE_SUPABASE_URL` | `https://gibqdecjcdyeyxtknbok.supabase.co` | Supabase URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | `.env` 파일 참조 | Service Role Key |

3. **CRON_SECRET 생성 방법**
   ```bash
   # 터미널에서 실행 (랜덤 문자열 생성)
   openssl rand -base64 32
   ```

4. **환경 변수 추가 후 재배포**
   ```bash
   vercel --prod
   ```

---

## 📊 자동화 동작 방식

### **1. 매일 새벽 3시 실행**
```
Vercel Cron Job (03:00 KST)
    ↓
/api/automation/daily-content (보안 검증)
    ↓
Supabase Edge Function: scheduled-daily-content
    ↓
20개 콘텐츠 생성 (5개 카테고리 순환)
```

### **2. 콘텐츠 생성 순서**
```
1회: 시내버스 → 5분 대기
2회: 공항버스 → 5분 대기
3회: 여권발급 → 5분 대기
4회: 병원 → 5분 대기
5회: GTX → 5분 대기
6회: 시내버스 (반복)
...
20회: GTX (완료)
```

### **3. 총 소요 시간**
- 콘텐츠 생성: 20개 × 평균 30초 = 10분
- 대기 시간: 19회 × 5분 = 95분
- **총 약 105분 (1시간 45분)**

---

## 📧 이메일 알림 시스템

### **에러 발생 시 자동 알림**
- 수신: `pcpc233@gmail.com`
- 내용:
  - 성공/실패 개수
  - 오류 상세 내역
  - 실행 시간

### **알림 예시**
```
📊 콘텐츠 자동화 실행 결과

✅ 성공: 18/20
❌ 실패: 2/20

🔴 오류 내역:
1. [병원] 키워드 없음
2. [GTX] 생성 실패: OpenAI API rate limit

⏰ 실행 시간: 2025-11-13 03:00:00
```

---

## 🎯 대상 카테고리

| 순번 | 카테고리 | 콘텐츠 수/일 |
|------|----------|-------------|
| 1 | 시내버스 | 4개 |
| 2 | 공항버스 | 4개 |
| 3 | 여권발급 | 4개 |
| 4 | 병원 | 4개 |
| 5 | GTX | 4개 |
| **합계** | | **20개/일** |

---

## 🔍 모니터링 방법

### **1. Admin 대시보드**
```
https://admin.bustime.site
→ 자동화 탭
→ 실행 로그 확인
```

### **2. Supabase 데이터베이스**
```sql
-- 최근 실행 로그
SELECT * FROM automation_logs
WHERE job_type = 'scheduled_daily_content'
ORDER BY executed_at DESC
LIMIT 10;

-- 발행된 콘텐츠 확인
SELECT * FROM longtail_content_pages
WHERE is_published = true
AND published_at >= NOW() - INTERVAL '1 day';
```

### **3. Vercel Cron Dashboard**
```
https://vercel.com/[your-username]/[project-name]/crons
```

---

## 🚨 문제 해결

### **Cron Job이 실행되지 않을 때**
1. Vercel 환경 변수 확인
2. `CRON_SECRET` 설정 확인
3. Vercel Cron 로그 확인

### **콘텐츠 생성 실패 시**
1. OpenAI API 키 확인 (`.env`)
2. Supabase 키워드 데이터 확인
3. Edge Function 로그 확인

### **이메일이 오지 않을 때**
1. `RESEND_API_KEY` 설정 확인 (Supabase Secrets)
2. 이메일 큐 테이블 확인: `alert_email_queue`

---

## 📝 수동 실행 방법

테스트를 위해 수동으로 실행하려면:

```bash
# Admin 대시보드에서
→ 자동화 탭
→ "매일 자동화 실행" 버튼 클릭

# 또는 API 직접 호출
curl -X POST https://bustime.site/api/automation/daily-content \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📈 예상 성장

- **월간 콘텐츠**: 20개/일 × 30일 = **600개**
- **연간 콘텐츠**: 600개/월 × 12개월 = **7,200개**
- **SEO 효과**: 3개월 후부터 유기적 트래픽 증가 예상

---

## ✅ 체크리스트

- [ ] Vercel 환경 변수 설정 (`CRON_SECRET`, `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Vercel 재배포 (`vercel --prod`)
- [ ] Vercel Cron Dashboard에서 스케줄 확인
- [ ] 첫 실행 후 이메일 수신 확인
- [ ] Admin 대시보드에서 로그 확인

---

**🎉 설정 완료 후 매일 새벽 3시에 자동으로 20개의 콘텐츠가 발행됩니다!**
