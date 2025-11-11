import { useState } from 'react';
import { Bus, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function BusCollectionTest() {
  const [isCollecting, setIsCollecting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const collectBuses = async () => {
    setIsCollecting(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(
        'https://gibqdecjcdyeyxtknbok.supabase.co/functions/v1/collect-seoul-buses',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpYnFkZWNqY2R5ZXl4dGtuYm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NTMwNzksImV4cCI6MjA3ODMyOTA3OX0.zstQH1P-4pPb2y74LhrH3uSws9I_KkQ55mPRAR0up84',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            apiKey: 'da6a1b3be689e14556c3240efefa1e49cac3f2fb6b19571adb4b58afffc6aa14'
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        const errorDetails = {
          error: data.error,
          apiResponse: data.apiResponse,
          hint: data.hint,
          rawResponse: data.rawResponse
        };
        setError(JSON.stringify(errorDetails, null, 2));
      }
    } catch (err: any) {
      setError(err.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Bus className="text-blue-600" size={40} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">서울시 버스 데이터 수집</h1>
              <p className="text-gray-600 mt-1">실시간 API 연동 테스트</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">수집 정보</h2>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 서울시 공공 API에서 버스 노선 정보 수집</li>
              <li>• 최대 100개 노선 자동 수집</li>
              <li>• 예상 소요 시간: 30초 ~ 1분</li>
              <li>• Supabase 데이터베이스에 자동 저장</li>
            </ul>
          </div>

          <button
            onClick={collectBuses}
            disabled={isCollecting}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white text-lg transition-all transform hover:scale-105 ${
              isCollecting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg'
            }`}
          >
            {isCollecting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={24} />
                수집 중... (30초~1분 소요)
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Bus size={24} />
                데이터 수집 시작
              </span>
            )}
          </button>

          {result && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="font-bold text-green-900 text-lg mb-2">수집 성공!</h3>
                  <div className="space-y-2 text-green-800">
                    <p className="text-xl font-semibold">
                      총 {result.collected}개 노선 수집 완료
                    </p>
                    <p className="text-sm">{result.message}</p>
                    {result.note && (
                      <p className="text-xs text-green-700 mt-3 p-3 bg-green-100 rounded">
                        💡 {result.note}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm font-medium text-green-900 mb-2">상세 응답:</p>
                    <pre className="text-xs bg-white p-3 rounded border border-green-200 overflow-x-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <XCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 text-lg mb-2">오류 발생</h3>
                  <pre className="text-xs bg-white p-4 rounded border border-red-300 overflow-x-auto text-red-800 whitespace-pre-wrap">
                    {error}
                  </pre>
                  <div className="mt-4 p-3 bg-red-100 rounded text-sm text-red-700">
                    <p className="font-medium mb-1">해결 방법:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>인터넷 연결을 확인하세요</li>
                      <li>API 키가 올바른지 확인하세요</li>
                      <li>잠시 후 다시 시도하세요</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">다음 단계</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>✓ 수집된 데이터는 자동으로 데이터베이스에 저장됩니다</p>
              <p>✓ 메인 페이지에서 "교통정보" 카테고리를 통해 확인 가능합니다</p>
              <p>✓ 각 버스 노선은 SEO 최적화된 상세 페이지로 자동 생성됩니다</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2"
          >
            ← 메인 페이지로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
