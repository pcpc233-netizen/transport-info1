import { useState, useEffect } from 'react';
import { TrendingUp, Eye, Users, Clock, BarChart3, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PageAnalytics {
  page_title: string;
  page_url: string;
  page_type: string;
  total_views: number;
  unique_visitors: number;
  avg_time_spent: number;
  last_viewed_at: string;
}

interface ContentPerformance {
  content_id: string;
  title: string;
  content_type: string;
  views_today: number;
  views_week: number;
  views_month: number;
  views_total: number;
  engagement_score: number;
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [topPages, setTopPages] = useState<PageAnalytics[]>([]);
  const [contentPerformance, setContentPerformance] = useState<ContentPerformance[]>([]);
  const [stats, setStats] = useState({
    totalViews: 0,
    uniqueVisitors: 0,
    avgTimeSpent: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const dateFilter = getDateFilter(dateRange);

      const { data: summaryData } = await supabase
        .from('page_analytics_summary')
        .select('*')
        .gte('date', dateFilter)
        .order('total_views', { ascending: false })
        .limit(20);

      if (summaryData) {
        setTopPages(summaryData);

        const totalViews = summaryData.reduce((sum, page) => sum + page.total_views, 0);
        const uniqueVisitors = summaryData.reduce((sum, page) => sum + page.unique_visitors, 0);
        const avgTime = summaryData.reduce((sum, page) => sum + (page.avg_time_spent || 0), 0) / summaryData.length || 0;

        setStats({
          totalViews,
          uniqueVisitors,
          avgTimeSpent: avgTime,
          totalPages: summaryData.length,
        });
      }

      const { data: perfData } = await supabase
        .from('content_performance')
        .select('*')
        .order('views_total', { ascending: false })
        .limit(20);

      if (perfData) {
        setContentPerformance(perfData);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateFilter = (range: string) => {
    const now = new Date();
    switch (range) {
      case 'today':
        return now.toISOString().split('T')[0];
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString().split('T')[0];
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return monthAgo.toISOString().split('T')[0];
      default:
        return now.toISOString().split('T')[0];
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}분 ${secs}초`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">분석 데이터 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="text-blue-400" />
          페이지 분석 대시보드
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange('today')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              dateRange === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            오늘
          </button>
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              dateRange === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            7일
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              dateRange === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            30일
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Eye className="text-blue-100" size={24} />
            <TrendingUp className="text-blue-200" size={20} />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatNumber(stats.totalViews)}
          </div>
          <div className="text-blue-100 text-sm">총 조회수</div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-green-100" size={24} />
            <Activity className="text-green-200" size={20} />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatNumber(stats.uniqueVisitors)}
          </div>
          <div className="text-green-100 text-sm">순 방문자</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="text-purple-100" size={24} />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatTime(stats.avgTimeSpent)}
          </div>
          <div className="text-purple-100 text-sm">평균 체류시간</div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="text-orange-100" size={24} />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatNumber(stats.totalPages)}
          </div>
          <div className="text-orange-100 text-sm">활성 페이지</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-400" />
            인기 페이지 TOP 20
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {topPages.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                아직 데이터가 없습니다. 페이지 조회가 시작되면 여기에 표시됩니다.
              </div>
            ) : (
              topPages.map((page, index) => (
                <div
                  key={index}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-bold text-lg">
                        #{index + 1}
                      </span>
                      <span className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs">
                        {page.page_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-green-400 flex items-center gap-1">
                        <Eye size={14} />
                        {formatNumber(page.total_views)}
                      </span>
                      <span className="text-purple-400 flex items-center gap-1">
                        <Users size={14} />
                        {formatNumber(page.unique_visitors)}
                      </span>
                    </div>
                  </div>
                  <div className="text-white font-medium text-sm mb-1 truncate">
                    {page.page_title || '제목 없음'}
                  </div>
                  <div className="text-gray-400 text-xs truncate">
                    {page.page_url}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="text-green-400" />
            콘텐츠 성과 TOP 20
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {contentPerformance.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                아직 데이터가 없습니다. 콘텐츠가 발행되면 여기에 표시됩니다.
              </div>
            ) : (
              contentPerformance.map((content, index) => (
                <div
                  key={content.content_id}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-bold text-lg">
                        #{index + 1}
                      </span>
                      <span className="px-2 py-1 bg-green-900 text-green-200 rounded text-xs">
                        {content.content_type}
                      </span>
                    </div>
                    <div className="text-yellow-400 text-sm">
                      점수: {content.engagement_score.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-white font-medium text-sm mb-2 truncate">
                    {content.title}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-gray-600 rounded p-2 text-center">
                      <div className="text-gray-400 mb-1">오늘</div>
                      <div className="text-white font-bold">
                        {formatNumber(content.views_today)}
                      </div>
                    </div>
                    <div className="bg-gray-600 rounded p-2 text-center">
                      <div className="text-gray-400 mb-1">주간</div>
                      <div className="text-white font-bold">
                        {formatNumber(content.views_week)}
                      </div>
                    </div>
                    <div className="bg-gray-600 rounded p-2 text-center">
                      <div className="text-gray-400 mb-1">월간</div>
                      <div className="text-white font-bold">
                        {formatNumber(content.views_month)}
                      </div>
                    </div>
                    <div className="bg-blue-600 rounded p-2 text-center">
                      <div className="text-blue-100 mb-1">전체</div>
                      <div className="text-white font-bold">
                        {formatNumber(content.views_total)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="text-center text-gray-400">
          <Activity className="mx-auto mb-2 text-blue-400" size={32} />
          <p className="text-sm">
            실시간 분석 데이터가 자동으로 수집되고 있습니다.
            <br />
            페이지별 상세 분석, 유입 경로, 디바이스 분석 등이 포함됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
