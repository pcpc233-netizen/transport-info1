import { useState, useEffect } from 'react';
import { Activity, Server, Database, Zap, RefreshCw, CheckCircle, AlertTriangle, XCircle, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AutomationLog {
  id: string;
  log_type: string;
  status: string;
  details: any;
  created_at: string;
}

interface AutomationSchedule {
  id: string;
  schedule_name: string;
  function_name: string;
  cron_expression: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  run_count: number;
  success_count: number;
  failure_count: number;
}

interface HealthMetric {
  id: string;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  status: string;
  measured_at: string;
}

export default function SystemMonitoring() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [schedules, setSchedules] = useState<AutomationSchedule[]>([]);
  const [health, setHealth] = useState<HealthMetric[]>([]);
  const [runningAutomation, setRunningAutomation] = useState(false);

  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    setLoading(true);
    try {
      const [logsResult, schedulesResult, healthResult] = await Promise.all([
        supabase
          .from('automation_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('automation_schedules')
          .select('*')
          .order('schedule_name'),
        supabase
          .from('system_health_metrics')
          .select('*')
          .order('measured_at', { ascending: false })
          .limit(10),
      ]);

      if (logsResult.data) setLogs(logsResult.data);
      if (schedulesResult.data) setSchedules(schedulesResult.data);
      if (healthResult.data) setHealth(healthResult.data);
    } catch (error) {
      console.error('Failed to load system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAutomation = async () => {
    setRunningAutomation(true);
    try {
      const sessionToken = sessionStorage.getItem('admin_session_token');

      if (!sessionToken) {
        alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        window.location.href = '/admin.html';
        return;
      }

      console.log('[SystemMonitoring] Full session token being sent:', sessionToken);
      console.log('[SystemMonitoring] Token length:', sessionToken.length);
      console.log('[SystemMonitoring] Token preview:', sessionToken.substring(0, 30) + '...');
      console.log('[SystemMonitoring] Fetching:', window.location.origin + '/api/automation/run');

      const response = await fetch('/api/automation/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      console.log('Automation response:', { status: response.status, result });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Session expired:', result);
          alert('세션이 만료되었습니다. 다시 로그인해주세요.\n\n디버그: ' + (result.debug ? JSON.stringify(result.debug) : result.error));
          sessionStorage.removeItem('admin_session_token');
          window.location.href = '/admin.html';
          return;
        }
        console.error('Automation failed:', result);
        alert('자동화 실패: ' + (result.error || '서버 오류') + '\n\n' + (result.debug ? JSON.stringify(result.debug) : ''));
        return;
      }

      if (result.success) {
        const published = result.summary?.content_published || 0;
        const verified = result.execution_log?.steps?.find((s: any) => s.step === 'verify-transport-data')?.verified || 0;

        alert(
          `✅ 팩트 기반 자동화 완료!\n\n` +
          `🔍 검증된 데이터: ${verified}개\n` +
          `📝 발행된 콘텐츠: ${published}개\n\n` +
          `모든 콘텐츠는 실제 교통 데이터를 기반으로 생성되었습니다.`
        );
        loadSystemData();
      } else {
        alert('자동화 실행 실패:\n' + result.error);
      }
    } catch (error: any) {
      console.error('Automation error:', error);
      alert('오류 발생:\n' + error.message);
    } finally {
      setRunningAutomation(false);
    }
  };

  const toggleSchedule = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('automation_schedules')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setSchedules(schedules.map(s =>
        s.id === id ? { ...s, is_active: !currentStatus } : s
      ));
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
      alert('스케줄 상태 변경 실패');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'healthy':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'warning':
      case 'partial_success':
        return <AlertTriangle className="text-yellow-400" size={20} />;
      case 'error':
      case 'critical':
      case 'failed':
        return <XCircle className="text-red-400" size={20} />;
      default:
        return <Activity className="text-gray-400" size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">시스템 데이터 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Server className="text-blue-400" />
          시스템 모니터링
        </h2>
        <div className="flex gap-2">
          <button
            onClick={loadSystemData}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={18} />
            새로고침
          </button>
          <button
            onClick={runAutomation}
            disabled={runningAutomation}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Play size={18} />
            {runningAutomation ? '실행 중...' : '수동 실행'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={28} />
            <div>
              <div className="text-green-100 text-sm">활성 스케줄</div>
              <div className="text-3xl font-bold text-white">
                {schedules.filter(s => s.is_active).length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Zap size={28} />
            <div>
              <div className="text-blue-100 text-sm">총 실행 횟수</div>
              <div className="text-3xl font-bold text-white">
                {schedules.reduce((sum, s) => sum + s.run_count, 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity size={28} />
            <div>
              <div className="text-purple-100 text-sm">성공률</div>
              <div className="text-3xl font-bold text-white">
                {schedules.length > 0
                  ? Math.round(
                      (schedules.reduce((sum, s) => sum + s.success_count, 0) /
                        Math.max(schedules.reduce((sum, s) => sum + s.run_count, 0), 1)) *
                        100
                    )
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Database className="text-blue-400" />
            자동화 스케줄
          </h3>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              스케줄 데이터가 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="bg-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white font-medium mb-1">
                        {schedule.schedule_name}
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {schedule.function_name}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleSchedule(schedule.id, schedule.is_active)}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        schedule.is_active
                          ? 'bg-green-900 text-green-200'
                          : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {schedule.is_active ? '활성화' : '비활성화'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-gray-600 rounded p-2">
                      <div className="text-gray-400 mb-1">총 실행</div>
                      <div className="text-white font-bold">{schedule.run_count}</div>
                    </div>
                    <div className="bg-green-900 rounded p-2">
                      <div className="text-green-300 mb-1">성공</div>
                      <div className="text-white font-bold">{schedule.success_count}</div>
                    </div>
                    <div className="bg-red-900 rounded p-2">
                      <div className="text-red-300 mb-1">실패</div>
                      <div className="text-white font-bold">{schedule.failure_count}</div>
                    </div>
                  </div>

                  {schedule.last_run_at && (
                    <div className="mt-2 text-xs text-gray-400">
                      마지막 실행: {new Date(schedule.last_run_at).toLocaleString('ko-KR')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="text-green-400" />
            실행 로그
          </h3>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              실행 로그가 없습니다. "수동 실행"을 클릭하여 자동화를 시작하세요.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span className="text-white font-medium text-sm">
                        {log.log_type}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleString('ko-KR')}
                    </span>
                  </div>

                  {log.details && (
                    <div className="text-xs text-gray-400 mt-2">
                      {log.details.total_published && (
                        <div>발행된 콘텐츠: {log.details.total_published}개</div>
                      )}
                      {log.details.errors?.length > 0 && (
                        <div className="text-red-400 mt-1">
                          오류 {log.details.errors.length}건
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {health.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Server className="text-purple-400" />
            시스템 상태
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {health.map((metric) => (
              <div
                key={metric.id}
                className="bg-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  {getStatusIcon(metric.status)}
                  <span className="text-xs text-gray-400">
                    {new Date(metric.measured_at).toLocaleTimeString('ko-KR')}
                  </span>
                </div>
                <div className="text-white font-medium mb-1">{metric.metric_name}</div>
                <div className="text-2xl font-bold text-blue-400">
                  {metric.metric_value.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">{metric.metric_type}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
