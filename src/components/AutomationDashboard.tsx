import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AutomationLog {
  id: string;
  log_type: string;
  status: string;
  details: any;
  created_at: string;
}

export default function AutomationDashboard() {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningNow, setRunningNow] = useState(false);
  const [stats, setStats] = useState({
    total_published_today: 0,
    total_services: 0,
    last_run: null as string | null,
  });

  useEffect(() => {
    loadLogs();
    loadStats();
  }, []);

  const loadLogs = async () => {
    const { data } = await supabase
      .from('automation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setLogs(data);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    // 오늘 발행된 콘텐츠 수
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: publishedToday } = await supabase
      .from('longtail_content_pages')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .gte('published_at', today.toISOString());

    // 전체 서비스 수
    const { count: totalServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // 마지막 실행 시간
    const { data: lastLog } = await supabase
      .from('automation_logs')
      .select('created_at')
      .eq('log_type', 'daily_automation')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setStats({
      total_published_today: publishedToday || 0,
      total_services: totalServices || 0,
      last_run: lastLog?.created_at || null,
    });
  };

  const runAutomation = async () => {
    const sessionToken = sessionStorage.getItem('admin_session_token');

    if (!sessionToken) {
      alert('세션이 만료되었습니다. 다시 로그인해주세요.');
      return;
    }

    setRunningNow(true);
    try {
      const response = await fetch('/api/automation/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          alert('세션이 만료되었습니다. 다시 로그인해주세요.');
          sessionStorage.removeItem('admin_session_token');
          window.location.reload();
          return;
        }
        alert('❌ 자동화 실패: ' + (result.error || '서버 오류'));
        return;
      }

      if (result.success) {
        alert(`✅ 자동화 완료!\n\n${result.summary?.content_published || 0}개 콘텐츠 발행됨`);
        loadLogs();
        loadStats();
      } else {
        alert('❌ 자동화 실패: ' + (result.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Automation error:', error);
      alert('❌ 오류 발생: ' + error);
    } finally {
      setRunningNow(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'partial_success':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'failed':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Activity className="text-gray-500" size={20} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">자동화 모니터링 대시보드</h1>
        <p className="text-gray-600">콘텐츠 자동 발행 시스템 상태 및 로그</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={32} />
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.total_published_today}</div>
              <div className="text-blue-100 text-sm">오늘 발행</div>
            </div>
          </div>
          <div className="text-blue-100 text-sm mt-4">
            목표: 하루 20개 ({Math.round((stats.total_published_today / 20) * 100)}%)
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Activity size={32} />
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.total_services}</div>
              <div className="text-green-100 text-sm">활성 서비스</div>
            </div>
          </div>
          <div className="text-green-100 text-sm mt-4">실제 데이터 기반 콘텐츠 생성</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Clock size={32} />
            <div className="text-right">
              <div className="text-lg font-bold">
                {stats.last_run ? formatDate(stats.last_run).split(' ')[1] : '-'}
              </div>
              <div className="text-purple-100 text-sm">마지막 실행</div>
            </div>
          </div>
          <div className="text-purple-100 text-sm mt-4">다음 실행: 내일 자정</div>
        </div>
      </div>

      {/* 수동 실행 버튼 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">수동 실행</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={runAutomation}
            disabled={runningNow}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              runningNow
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {runningNow ? (
              <>
                <Activity className="animate-spin" size={20} />
                실행 중...
              </>
            ) : (
              <>
                <Activity size={20} />
                자동화 지금 실행
              </>
            )}
          </button>
          <div className="text-sm text-gray-600">
            버스 데이터 수집 + 롱테일 콘텐츠 20개 발행
          </div>
        </div>
      </div>

      {/* 실행 로그 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">실행 로그</h2>
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(log.status)}
                  <span className="font-semibold text-gray-900">
                    {log.log_type === 'daily_automation' ? '일일 자동화' : log.log_type}
                  </span>
                </div>
                <span className="text-sm text-gray-600">{formatDate(log.created_at)}</span>
              </div>

              {log.details && (
                <div className="mt-3 space-y-2">
                  {log.details.summary && (
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">전체 단계</div>
                        <div className="font-semibold">{log.details.summary.total_steps}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">성공</div>
                        <div className="font-semibold text-green-600">
                          {log.details.summary.successful_steps}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">실패</div>
                        <div className="font-semibold text-red-600">
                          {log.details.summary.failed_steps}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">발행</div>
                        <div className="font-semibold text-blue-600">
                          {log.details.summary.content_published}개
                        </div>
                      </div>
                    </div>
                  )}

                  {log.details.steps && log.details.steps.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm text-blue-600 cursor-pointer hover:underline">
                        상세 단계 보기
                      </summary>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {log.details.steps.map((step: any, index: number) => (
                          <div key={index} className="pl-4 border-l-2 border-gray-200">
                            <span className="font-medium">{step.step}</span>
                            {step.message && <span className="ml-2">- {step.message}</span>}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}

          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">아직 실행 로그가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
