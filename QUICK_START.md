# 🚀 즉시 시작 가이드

## 📋 Week 1: 공공 API 연동

### Day 1: API 키 발급 (30분)

1. **공공데이터포털 가입**
   - https://www.data.go.kr 접속
   - 회원가입 (무료)

2. **API 신청**
   - "전국버스운행정보" 검색 → 활용신청
   - "서울시 버스도착정보" 검색 → 활용신청
   - "경기도 버스정보" 검색 → 활용신청

3. **API 키 저장**
   ```
   승인 후 마이페이지에서 API 키 복사
   나중에 사용할 것!
   ```

---

### Day 2-3: 첫 100개 버스 수집 (2시간)

AdminPanel에서 실행:

```javascript
// 1. 데이터 수집 함수 호출
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/collect-korea-buses`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    }
  }
);

const result = await response.json();
console.log('수집 완료:', result);
// 결과: { success: true, collected: 100, ... }
```

**확인:**
```sql
SELECT COUNT(*) FROM services WHERE name LIKE '%버스%';
-- 결과: 100개 이상
```

---

## 📋 Week 2: 롱테일 페이지 생성

### Day 4-5: 500개 페이지 생성 (1시간)

```javascript
// 2. 롱테일 페이지 생성
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-longtail-pages`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    }
  }
);

const result = await response.json();
console.log('생성 완료:', result);
// 결과: { success: true, pagesGenerated: 500, ... }
```

**확인:**
```sql
SELECT COUNT(*) FROM longtail_combinations;
-- 결과: 500개 이상
```

---

### Day 6-7: 페이지 발행 (1시간)

```javascript
// 3. 페이지 발행
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/publish-longtail-content`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ limit: 500 })
  }
);

const result = await response.json();
console.log('발행 완료:', result);
```

**확인:**
```sql
SELECT COUNT(*) FROM longtail_combinations WHERE is_published = true;
-- 결과: 500개
```

---

## 📋 Week 3: 대량 생성 (10,000개)

### 매일 실행 스크립트

```javascript
// AdminPanel에서 매일 실행
async function dailyBatch() {
  console.log('배치 시작...');
  
  // 1. 데이터 수집
  await fetch(`${url}/functions/v1/collect-korea-buses`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}` }
  });
  
  console.log('2시간 대기...');
  await new Promise(r => setTimeout(r, 2 * 60 * 60 * 1000));
  
  // 2. 롱테일 생성
  await fetch(`${url}/functions/v1/generate-longtail-pages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}` }
  });
  
  console.log('1시간 대기...');
  await new Promise(r => setTimeout(r, 60 * 60 * 1000));
  
  // 3. 발행
  await fetch(`${url}/functions/v1/publish-longtail-content`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ limit: 5000 })
  });
  
  console.log('배치 완료!');
}

// 실행
dailyBatch();
```

---

## 📋 Week 4: SEO 및 구글 등록

### Day 11: 사이트맵 생성

```javascript
// 사이트맵 생성
const response = await fetch(
  `${url}/functions/v1/generate-sitemap`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}` }
  }
);
```

### Day 12: Google Search Console

1. https://search.google.com/search-console 접속
2. "속성 추가" 클릭
3. 도메인 입력
4. 사이트맵 제출: `yourdomain.com/sitemap.xml`

---

## 📊 진행 상황 확인

### 데이터 현황
```sql
-- 총 버스 수
SELECT COUNT(*) as total_buses FROM services WHERE name LIKE '%버스%';

-- 총 페이지 수
SELECT COUNT(*) as total_pages FROM longtail_combinations;

-- 발행된 페이지
SELECT COUNT(*) as published FROM longtail_combinations WHERE is_published = true;

-- 도시별 현황
SELECT 
  address as city,
  COUNT(*) as bus_count
FROM services
WHERE name LIKE '%버스%'
GROUP BY address
ORDER BY bus_count DESC;
```

---

## 🎯 체크리스트

### Week 1
- [ ] 공공 API 키 3개 발급
- [ ] 첫 100개 버스 수집 완료

### Week 2
- [ ] 500개 롱테일 페이지 생성
- [ ] 발행 시스템 테스트 완료

### Week 3
- [ ] 10,000개 페이지 달성
- [ ] 사이트맵 생성

### Week 4
- [ ] Google Search Console 등록
- [ ] 첫 트래픽 확인

---

## 💡 다음 단계

**목표:**
- Month 3: 일 10,000 PV
- Month 6: 일 50,000 PV, 일 $50
- Month 12: 일 100,000 PV, 일 $100 ✅

**지금 바로 Week 1 Day 1부터 시작하세요!** 🚀
