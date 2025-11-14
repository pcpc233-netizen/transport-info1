import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const SEOUL_BUS_API_KEY = Deno.env.get('SEOUL_BUS_API_KEY')!;
const ADMIN_EMAIL = 'pcpc233@gmail.com';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  apiResponse?: any;
}

async function verifySeoulBusRoute(routeNumber: string): Promise<ValidationResult> {
  try {
    const url = `http://ws.bus.go.kr/api/rest/busRouteInfo/getBusRouteList?serviceKey=${SEOUL_BUS_API_KEY}&strSrch=${encodeURIComponent(routeNumber)}`;
    
    const response = await fetch(url);
    const text = await response.text();
    
    if (!text.includes('<itemList>')) {
      return {
        isValid: false,
        errors: ['노선 정보가 존재하지 않습니다'],
        apiResponse: { status: 'not_found' },
      };
    }
    
    if (text.includes('<busRouteNm>')) {
      const routeMatch = text.match(/<busRouteNm>([^<]+)<\/busRouteNm>/);
      const routeIdMatch = text.match(/<busRouteId>([^<]+)<\/busRouteId>/);
      
      return {
        isValid: true,
        errors: [],
        apiResponse: {
          routeName: routeMatch?.[1],
          routeId: routeIdMatch?.[1],
          status: 'valid',
        },
      };
    }
    
    return {
      isValid: false,
      errors: ['API 응답 형식이 올바르지 않습니다'],
      apiResponse: { status: 'invalid_format' },
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`API 호출 실패: ${error.message}`],
      apiResponse: { status: 'error', error: error.message },
    };
  }
}

async function sendValidationAlert(supabase: any, details: any) {
  try {
    await supabase.from('alert_email_queue').insert({
      recipient: ADMIN_EMAIL,
      subject: `⚠️ [bustime.site] 데이터 검증 경고`,
      body: `데이터 검증 중 문제가 발견되었습니다.\n\n${JSON.stringify(details, null, 2)}`,
      priority: 'high',
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to queue alert:', error);
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
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { combinationIds, batchSize = 100 } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, serviceKey!);

    let query = supabase
      .from('longtail_combinations')
      .select(`
        *,
        service:services!inner(*)
      `)
      .eq('data_verified', false)
      .is('verification_checked_at', null);

    if (combinationIds && combinationIds.length > 0) {
      query = query.in('id', combinationIds);
    } else {
      query = query.limit(batchSize);
    }

    const { data: combinations, error: fetchError } = await query;

    if (fetchError) throw fetchError;
    if (!combinations || combinations.length === 0) {
      return new Response(
        JSON.stringify({ success: true, verified: 0, message: '검증할 조합이 없습니다' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`${combinations.length}개 조합 검증 시작...`);

    const results = {
      total: combinations.length,
      verified: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const combo of combinations) {
      await supabase
        .from('longtail_combinations')
        .update({
          status: 'verifying',
          verification_checked_at: new Date().toISOString(),
        })
        .eq('id', combo.id);

      const service = combo.service;
      let validation: ValidationResult = { isValid: true, errors: [] };

      if (service.service_number && service.category_id) {
        const categoryCheck = await supabase
          .from('service_categories')
          .select('name')
          .eq('id', service.category_id)
          .maybeSingle();

        if (categoryCheck.data?.name?.includes('버스')) {
          validation = await verifySeoulBusRoute(service.service_number);
          
          await new Promise(resolve => setTimeout(resolve, 200));
        } else {
          validation = { isValid: true, errors: [] };
        }
      }

      await supabase.from('data_validation_logs').insert({
        validation_type: 'bus_route',
        source_type: 'longtail_combination',
        source_id: combo.id,
        is_valid: validation.isValid,
        validation_errors: validation.errors,
        api_response: validation.apiResponse,
        created_at: new Date().toISOString(),
      });

      await supabase
        .from('longtail_combinations')
        .update({
          data_verified: validation.isValid,
          status: validation.isValid ? 'verified' : 'failed',
          verification_errors: validation.errors.length > 0 ? validation.errors : null,
        })
        .eq('id', combo.id);

      if (validation.isValid) {
        results.verified++;
      } else {
        results.failed++;
        results.errors.push({
          combination_id: combo.id,
          service: service.name,
          errors: validation.errors,
        });
      }
    }

    if (results.failed > results.total * 0.5) {
      await sendValidationAlert(supabase, {
        message: '검증 실패율이 50%를 초과했습니다',
        results,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`검증 완료: ${results.verified}개 성공, ${results.failed}개 실패`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `${results.verified}개 조합이 검증되었습니다`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});