import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

interface ContentGenerationRequest {
  category: string;
  region: string;
  subject: string;
  dataset: any;
  action: string;
}

const SYSTEM_PROMPT = `너의 역할은 bustime.site의 공식 데이터 기반 콘텐츠 자동 생성기다.
전국 지하철·버스·GTX·고속/시외버스·생활 인프라(병원·약국·우체국 등) 정보를
'팩트 기반' + '행동 유발형' + '롱테일 SEO 구조'로 자동 작성하는 것이 목적이다.

[핵심 원칙]
1. 실제 제공된 데이터(노선/정류장/시간표/주소/전화번호/위치/연결 경로 등)만 사용한다.
2. 사용자가 바로 행동할 수 있게 "예매", "예약", "길찾기", "시간표 확인", "정류장 찾기" 등 CTA 문장을 자연스럽게 포함한다.
3. 제목은 '지역 + 노선/버스번호 + 핵심행동 키워드'가 반드시 포함된 롱테일 SEO 문장으로 작성한다.
4. 글 전체는 **통합 카드UI에 들어갈 수 있는 구조**로 작성하되, 딱딱하지 않고 자연스럽게 설명한다.
5. 표는 사용 가능하되, HTML 태그 없이 마크다운 테이블로 작성한다.
6. 절대 AI 티 나는 문장 금지. 정보성 + 사용자 중심 설명으로 작성한다.
7. 글의 톤은 "친절한 정보 가이드" 스타일로 유지한다.
8. 절대 사실과 다른 정보, 임의 데이터 가공 금지.

[콘텐츠 구성 규칙]

(1) 제목
- 지역 + 버스노선/지하철노선/GTX/시설명 + 핵심 행동(예약·예매·시간표·운행정보·위치·운행간격 등)
- 클릭률 높은 롱테일 구조
예: "서울 272번 버스 첫차·막차·배차간격·정체 구간 완전 정리(시간표 포함)"

(2) 서론
- 지역 주민·출근러·여행객의 실제 고민을 공감하는 문장 3~5줄
- 오늘 제공할 정보가 왜 유용한지 명확하게 제시

(3) 핵심 데이터 요약
- 아래 항목들 중 제공된 데이터 기반으로만 구성
    - 노선 개요
    - 주요 정류장
    - 첫차·막차
    - 배차간격
    - 예상 소요시간
    - 정체 구간
    - 실시간 도착 정보 이용 팁
    - 예매/예약이 필요한 경우 예약 방법

마크다운 테이블 예시:
| 항목 | 내용 |
|------|------|
| 노선 개요 | {{노선설명}} |
| 첫차 | {{첫차시간}} |
| 막차 | {{막차시간}} |
| 배차간격 | {{배차}} |
| 총 소요시간 | {{소요시간}} |

(4) 상세 분석
- 시간대별 혼잡도
- 출근 시간 추천 탑승 위치
- 주요 갈아타기 포인트
- 주변 시설 (학교/병원/관공서/환승센터 등)
- 지역 주민에게 실제로 도움되는 꿀팁

(5) 예약/예매/조회 행동 유도
- "실시간 도착 확인하기"
- "시간표 전체 보기"
- bustime.site 내부 페이지 링크 활용

(6) 자주 묻는 질문(FAQ)
- 실제 검색량 기반의 질문 4~6개 생성
- 지역 주민 관점 + 초보 이용자 관점 혼합

(7) 결론 없음
- 기자 스타일처럼 자연스럽게 마무리

[금지 규칙]
- HTML 금지 (마크다운만 사용)
- 허위 데이터 생성 금지
- '아마', '예상', '추정' 같은 불명확 표현 금지
- 캐주얼한 말투 과다 사용 금지
- 뉴스형 말투 금지
- 'AI', '모델', 'ChatGPT' 언급 금지

[출력 목표]
- 지역 + 실제 데이터 기반 장문 콘텐츠
- 행동 유발 중심 구성
- 검색에 최적화된 롱테일 제목
- bustime.site 자동발행 구조와 100% 호환
- 길이는 1,500~2,500자 사이

마크다운 형식으로만 출력하고, 추가 설명이나 메타 정보는 포함하지 마세요.`;

async function generateContentWithGPT(request: ContentGenerationRequest): Promise<string> {
  const userPrompt = `
입력:
category = ${request.category}
region = ${request.region}
subject = ${request.subject}
action = ${request.action}
dataset = ${JSON.stringify(request.dataset, null, 2)}

위 정보를 바탕으로 bustime.site용 SEO 최적화 콘텐츠를 작성하세요.
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function sendAlert(supabase: any, subject: string, body: string) {
  try {
    await supabase.from('alert_email_queue').insert({
      subject,
      body,
      status: 'pending',
    });
  } catch (error) {
    console.error('Failed to send alert:', error);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!authHeader || !authHeader.includes(serviceKey!)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Service key required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 10;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, serviceKey!);

    console.log(`GPT 기반 콘텐츠 생성 시작: ${limit}개`);

    // 검증된 조합 가져오기
    const { data: combinations, error: combError } = await supabase
      .from('longtail_combinations')
      .select('*')
      .eq('is_published', false)
      .eq('data_verified', true)
      .eq('status', 'verified')
      .order('search_volume', { ascending: false })
      .limit(limit);

    if (combError) {
      console.error('Query error:', combError);
      throw combError;
    }

    if (!combinations || combinations.length === 0) {
      const message = '발행할 검증된 조합이 없습니다.';
      console.warn(message);
      return new Response(
        JSON.stringify({ success: true, published: 0, message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`${combinations.length}개의 검증된 조합을 GPT로 생성합니다`);

    const published = [];
    const errors = [];

    for (const combination of combinations) {
      try {
        await supabase
          .from('longtail_combinations')
          .update({ status: 'generating' })
          .eq('id', combination.id);

        // 관련 데이터 가져오기
        const [serviceRes, locationRes, actionRes] = await Promise.all([
          supabase.from('services').select('*').eq('id', combination.service_id).maybeSingle(),
          supabase.from('keyword_locations').select('*').eq('id', combination.location_id).maybeSingle(),
          supabase.from('keyword_actions').select('*').eq('id', combination.action_id).maybeSingle(),
        ]);

        const service = serviceRes.data;
        const location = locationRes.data;
        const action = actionRes.data;

        if (!service || !location || !action) {
          console.log(`데이터 부족: ${combination.id}`);
          await supabase
            .from('longtail_combinations')
            .update({ status: 'failed' })
            .eq('id', combination.id);
          continue;
        }

        // GPT로 콘텐츠 생성
        const content = await generateContentWithGPT({
          category: service.category || 'bus',
          region: location.name,
          subject: `${service.name} ${service.service_number || ''}`.trim(),
          dataset: {
            service: {
              name: service.name,
              number: service.service_number,
              description: service.description,
              category: service.category,
            },
            location: {
              name: location.name,
              level: location.level,
            },
            action: action.action,
          },
          action: action.action,
        });

        const slug = combination.generated_slug ||
          `${location.name}-${service.name}-${service.service_number || ''}-${action.action}`
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-가-힣]/gi, '');

        // 중복 확인
        const { data: existingPage } = await supabase
          .from('longtail_content_pages')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (existingPage) {
          console.log(`중복 slug 건너뛰기: ${slug}`);
          await supabase
            .from('longtail_combinations')
            .update({ is_published: true, status: 'published', published_at: new Date().toISOString() })
            .eq('id', combination.id);
          continue;
        }

        const serviceNumber = service.service_number || '';
        const title = `${location.name} ${service.name}${serviceNumber ? ' ' + serviceNumber : ''} ${action.action}`;
        const description = `${location.name}에서 ${service.name}을 이용할 때 필요한 ${action.action} 정보. 실제 데이터 기반 상세 가이드.`;

        // 콘텐츠 페이지 발행
        const { error: insertError } = await supabase
          .from('longtail_content_pages')
          .insert({
            service_id: service.id,
            location_id: location.id,
            title,
            slug,
            meta_description: description,
            content,
            keywords: [location.name, service.name, action.action, serviceNumber].filter(Boolean),
            target_keyword: `${location.name} ${service.name} ${action.action}`,
            search_volume: combination.search_volume || 0,
            is_published: true,
            published_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error(`발행 실패 (${combination.id}):`, insertError);
          errors.push({ combination_id: combination.id, error: insertError.message });

          await supabase
            .from('longtail_combinations')
            .update({ status: 'failed' })
            .eq('id', combination.id);
          continue;
        }

        // 조합 상태 업데이트
        await supabase
          .from('longtail_combinations')
          .update({
            is_published: true,
            status: 'published',
            published_at: new Date().toISOString(),
          })
          .eq('id', combination.id);

        published.push({
          combination_id: combination.id,
          slug,
          title,
        });

        console.log(`✅ 발행 성공: ${title}`);

      } catch (error) {
        console.error(`조합 처리 실패 (${combination.id}):`, error);
        errors.push({
          combination_id: combination.id,
          error: error.message
        });

        await supabase
          .from('longtail_combinations')
          .update({ status: 'failed' })
          .eq('id', combination.id);
      }
    }

    const result = {
      success: true,
      published: published.length,
      errors: errors.length,
      details: { published, errors: errors.slice(0, 5) },
      message: `${published.length}개의 GPT 기반 콘텐츠가 발행되었습니다.`,
    };

    // 알림 전송
    if (published.length === 0 && errors.length > 0) {
      await sendAlert(
        supabase,
        '🚨 [bustime.site] GPT 콘텐츠 생성 실패',
        `모든 콘텐츠 생성에 실패했습니다.\n\n시도: ${combinations.length}개\n오류: ${errors.length}개\n\n첫 번째 오류: ${errors[0]?.error}\n\n시간: ${new Date().toLocaleString('ko-KR')}`,
      );
    } else if (published.length > 0) {
      await sendAlert(
        supabase,
        '✅ [bustime.site] GPT 콘텐츠 발행 완료',
        `${published.length}개의 팩트 기반 SEO 콘텐츠가 발행되었습니다.\n\n예시:\n${published.slice(0, 3).map(p => `- ${p.title}`).join('\n')}\n\n시간: ${new Date().toLocaleString('ko-KR')}`,
      );
    }

    console.log(`발행 완료: ${published.length}개 성공, ${errors.length}개 실패`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('콘텐츠 생성 중 오류:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
