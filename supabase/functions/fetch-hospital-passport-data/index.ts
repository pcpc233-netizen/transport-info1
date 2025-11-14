import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = {
      hospitalsAdded: 0,
      passportOfficesAdded: 0,
      errors: [] as string[],
    };

    // 주요 병원 실제 데이터
    const hospitalData = [
      {
        name: '삼성서울병원',
        slug: 'samsung-medical-center',
        address: '서울특별시 강남구 일원본동 81',
        phone: '1599-3114',
        operating_hours: '평일 08:00-17:00 / 토요일 08:00-12:00',
        description: '강남구 삼성동에 위치한 대형 종합병원',
        long_description: '삼성서울병원은 1994년 개원한 종합병원으로, 서울 강남구에 위치하고 있습니다. 40개 이상의 진료과와 1,900여 개의 병상을 보유하고 있으며, 국내 최고 수준의 의료 서비스를 제공합니다.',
        usage_tips: '예약은 전화, 모바일 앱, 홈페이지를 통해 가능합니다. 초진 환자는 의뢰서가 필요합니다.',
        website_url: 'https://www.samsunghospital.com',
        difficulty_level: 'medium',
      },
      {
        name: '서울아산병원',
        slug: 'asan-medical-center',
        address: '서울특별시 송파구 올림픽로 43길 88',
        phone: '1688-7575',
        operating_hours: '평일 08:30-17:00 / 토요일 08:30-12:30',
        description: '송파구에 위치한 국내 최대 규모 종합병원',
        long_description: '서울아산병원은 1989년 개원한 국내 최대 규모의 종합병원입니다. 2,700여 개의 병상을 보유하고 있으며, 암, 심장, 장기이식 등 중증 질환 치료에 특화되어 있습니다.',
        usage_tips: '지하철 2호선, 5호선, 9호선 올림픽공원역에서 도보 5분 거리입니다. 주차는 유료이므로 대중교통 이용을 권장합니다.',
        website_url: 'https://www.amc.seoul.kr',
        difficulty_level: 'medium',
      },
      {
        name: '세브란스병원',
        slug: 'severance-hospital',
        address: '서울특별시 서대문구 연세로 50-1',
        phone: '1599-1004',
        operating_hours: '평일 08:30-17:00 / 토요일 08:30-12:00',
        description: '신촌역 근처 연세대학교 의료원',
        long_description: '세브란스병원은 1885년 개원한 한국 최초의 근대식 병원입니다. 연세대학교 의과대학 부속병원으로, 1,700여 개의 병상을 보유하고 있으며 다양한 진료과를 운영하고 있습니다.',
        usage_tips: '지하철 2호선 신촌역 1번 출구에서 도보 3분 거리입니다. 온라인 예약 시스템을 적극 활용하세요.',
        website_url: 'https://sev.severance.healthcare',
        difficulty_level: 'medium',
      },
    ];

    // 여권 발급소 실제 데이터
    const passportData = [
      {
        name: '강남구청 여권민원실',
        slug: 'passport-gangnam-office',
        address: '서울특별시 강남구 학동로 426',
        phone: '02-3423-5400',
        operating_hours: '평일 09:00-18:00 (점심시간 12:00-13:00)',
        description: '강남역 5분 거리 여권발급센터',
        long_description: '강남구청 여권민원실은 강남역 근처에 위치하여 접근성이 뛰어난 여권 발급 기관입니다. 신규 발급, 재발급, 기재사항 변경 등 모든 여권 업무를 처리할 수 있습니다. 점심시간에는 업무가 중단되니 참고하세요.',
        usage_tips: '예약 없이 방문 가능하나 대기 시간이 길 수 있습니다. 신분증, 사진, 본인명의 통장을 최부하세요.',
        website_url: 'https://www.gangnam.go.kr',
        difficulty_level: 'easy',
      },
      {
        name: '서초구청 여권민원실',
        slug: 'passport-seocho-seoul',
        address: '서울특별시 서초구 서초대로 350',
        phone: '02-2155-6915',
        operating_hours: '평일 09:00-18:00 (점심시간 12:00-13:00)',
        description: '강남역, 교대역 접근 가능한 여권센터',
        long_description: '서초구청 여권민원실은 강남역과 교대역에서 모두 접근 가능한 위치에 있습니다. 전자여권 발급부터 일반여권까지 모든 종류의 여권 발급이 가능합니다.',
        usage_tips: '공용주차장 이용이 가능하나 주차비가 부과됩니다. 대중교통 이용을 권장합니다.',
        website_url: 'https://www.seocho.go.kr',
        difficulty_level: 'easy',
      },
      {
        name: '송파구청 여권과',
        slug: 'passport-songpa-seoul',
        address: '서울특별시 송파구 올림픽로 326',
        phone: '02-2147-2800',
        operating_hours: '평일 09:00-18:00 (점심시간 12:00-13:00)',
        description: '잠실, 문정 지역 여권발급센터',
        long_description: '송파구청 여권과는 잠실, 석촌, 문정 지역 주민들을 위한 여권 발급 기관입니다. 9호선 송파나루공원역 근처에 위치하여 접근성이 좋습니다.',
        usage_tips: '직장인을 위해 점심시간에도 일부 창구를 운영합니다. 사전 확인 후 방문하세요.',
        website_url: 'https://www.songpa.go.kr',
        difficulty_level: 'easy',
      },
      {
        name: '마포구청 여권민원실',
        slug: 'passport-mapo-seoul',
        address: '서울특별시 마포구 월드컵북로 212',
        phone: '02-3153-8114',
        operating_hours: '평일 09:00-18:00 (점심시간 12:00-13:00)',
        description: '홍대, 공덕, 마포 지역 여권발급',
        long_description: '마포구청 여권민원실은 홍대입구역, 공덕역, 마포역에서 모두 접근 가능한 위치에 있습니다. 여권 신규 발급, 재발급, 훈손/분실 신고 등 모든 업무를 처리할 수 있습니다.',
        usage_tips: '여권 사진은 현장에서 촬영 가능하나 별도 요금이 부과됩니다. 미리 준비하는 것을 권장합니다.',
        website_url: 'https://www.mapo.go.kr',
        difficulty_level: 'easy',
      },
    ];

    // 카테고리 ID 가져오기
    const { data: medicalCat } = await supabase
      .from('service_categories')
      .select('id')
      .eq('slug', 'medical')
      .maybeSingle();

    const { data: documentCat } = await supabase
      .from('service_categories')
      .select('id')
      .eq('slug', 'documents')
      .maybeSingle();

    // 병원 데이터 처리
    for (const hospital of hospitalData) {
      try {
        const { data: existing } = await supabase
          .from('services')
          .select('id')
          .eq('slug', hospital.slug)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('services')
            .update({
              ...hospital,
              category_id: medicalCat?.id,
              is_active: true,
              seo_keywords: [hospital.name, '병원', '진료', '예약', '의료'],
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('services').insert({
            ...hospital,
            category_id: medicalCat?.id,
            is_active: true,
            seo_keywords: [hospital.name, '병원', '진료', '예약', '의료'],
          });
          results.hospitalsAdded++;
        }
      } catch (error) {
        results.errors.push(`${hospital.name}: ${error.message}`);
      }
    }

    // 여권 발급소 데이터 처리
    for (const passport of passportData) {
      try {
        const { data: existing } = await supabase
          .from('services')
          .select('id')
          .eq('slug', passport.slug)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('services')
            .update({
              ...passport,
              category_id: documentCat?.id,
              is_active: true,
              seo_keywords: ['여권', '발급', '신기', '재발급', '민원'],
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('services').insert({
            ...passport,
            category_id: documentCat?.id,
            is_active: true,
            seo_keywords: ['여권', '발급', '신기', '재발급', '민원'],
          });
          results.passportOfficesAdded++;
        }
      } catch (error) {
        results.errors.push(`${passport.name}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `병원 ${results.hospitalsAdded}개, 여권발급소 ${results.passportOfficesAdded}개가 추가/업데이트되었습니다.`,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
