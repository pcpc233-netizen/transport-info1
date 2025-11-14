/**
 * 공공데이터포털 API 공용 헬퍼 함수
 *
 * 이 파일은 모든 수집 함수에서 공통으로 사용하는 유틸리티를 제공합니다.
 */

import { PUBLIC_DATA_API_KEY } from './publicDataApiKey.ts';
import type { TransportSourceConfig } from './transportDataSources.ts';

/**
 * API URL 생성 헬퍼
 * serviceKey를 자동으로 추가하고, 추가 파라미터를 설정합니다.
 */
export function buildApiUrl(
  source: TransportSourceConfig,
  params?: Record<string, string>
): URL {
  const url = new URL(source.endpoint);

  url.searchParams.set('serviceKey', PUBLIC_DATA_API_KEY);

  if (source.defaultParams) {
    for (const [key, value] of Object.entries(source.defaultParams)) {
      url.searchParams.set(key, value);
    }
  }

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

/**
 * API 호출 로깅 헬퍼
 * API 키를 마스킹하여 안전하게 로깅합니다.
 */
export function logApiCall(url: URL): void {
  const safeUrl = url.toString().replace(PUBLIC_DATA_API_KEY, '***MASKED***');
  console.log('API 호출:', safeUrl);
}

/**
 * XML 파싱 헬퍼
 */
export function parseXml(xmlText: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(xmlText, 'text/xml');
}

/**
 * XML 요소에서 텍스트 추출
 */
export function getXmlText(element: Element | null, selector: string, defaultValue = ''): string {
  return element?.querySelector(selector)?.textContent?.trim() || defaultValue;
}

/**
 * Raw API 응답 저장
 */
export async function saveRawResponse(
  supabase: any,
  source: TransportSourceConfig,
  rawData: string,
  status: 'success' | 'failed' = 'success'
): Promise<void> {
  try {
    await supabase.from('raw_api_responses').insert({
      source_key: source.key,
      provider: source.provider,
      region: source.region,
      category: source.category,
      endpoint: source.endpoint,
      response_format: source.responseFormat,
      raw_data: rawData,
      status,
      collected_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Raw 데이터 저장 실패:', error);
  }
}

/**
 * 자동화 로그 저장
 */
export async function logAutomation(
  supabase: any,
  taskName: string,
  status: 'success' | 'failed',
  message: string,
  details?: any
): Promise<void> {
  try {
    await supabase.from('automation_logs').insert({
      task_name: taskName,
      status,
      message,
      details,
    });
  } catch (error) {
    console.error('자동화 로그 저장 실패:', error);
  }
}

/**
 * 교통정보 카테고리 조회
 */
export async function getTrafficCategory(supabase: any): Promise<any> {
  const { data: category } = await supabase
    .from('service_categories')
    .select('id')
    .ilike('slug', '%traffic%')
    .maybeSingle();

  if (!category) {
    throw new Error('교통정보 카테고리를 찾을 수 없습니다.');
  }

  return category;
}

/**
 * 배치 서비스 저장
 * 50개씩 묶어서 저장하여 성능 최적화
 */
export async function batchUpsertServices(
  supabase: any,
  services: any[],
  batchSize = 50
): Promise<number> {
  let totalSaved = 0;

  for (let i = 0; i < services.length; i += batchSize) {
    const batch = services.slice(i, i + batchSize);

    const { error } = await supabase.from('services').upsert(batch, {
      onConflict: 'service_number,category_id',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`배치 저장 실패 (${i}-${i + batch.length}):`, error);
      throw error;
    }

    totalSaved += batch.length;
    console.log(`${totalSaved}개 저장 완료`);
  }

  return totalSaved;
}

/**
 * 표준 CORS 헤더
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

/**
 * 표준 에러 응답
 */
export function errorResponse(error: Error, status = 500): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: error.message,
    }),
    {
      status,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * 표준 성공 응답
 */
export function successResponse(data: any): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data,
    }),
    {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    }
  );
}
