import { useState, useEffect } from 'react';
import { Clock, Plus, Edit, Trash2, Save, X, Power } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Schedule {
  id: string;
  schedule_name: string;
  function_name: string;
  cron_expression: string;
  is_active: boolean;
  description: string | null;
  created_at: string;
}

interface ScheduleForm {
  schedule_name: string;
  function_name: string;
  cron_expression: string;
  description: string;
  hour: string;
  minute: string;
  days: string[];
}

const WEEKDAYS = [
  { value: '0', label: '일' },
  { value: '1', label: '월' },
  { value: '2', label: '화' },
  { value: '3', label: '수' },
  { value: '4', label: '목' },
  { value: '5', label: '금' },
  { value: '6', label: '토' },
];

const PRESET_SCHEDULES = [
  { label: '매일 새벽 2시', cron: '0 2 * * *', hour: '2', minute: '0', days: ['0','1','2','3','4','5','6'] },
  { label: '평일 오전 9시', cron: '0 9 * * 1-5', hour: '9', minute: '0', days: ['1','2','3','4','5'] },
  { label: '매시간 정각', cron: '0 * * * *', hour: '*', minute: '0', days: ['0','1','2','3','4','5','6'] },
  { label: '매시간 30분', cron: '30 * * * *', hour: '*', minute: '30', days: ['0','1','2','3','4','5','6'] },
];

export default function AutomationScheduleManager() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ScheduleForm>({
    schedule_name: '',
    function_name: 'daily-automation',
    cron_expression: '0 2 * * *',
    description: '',
    hour: '2',
    minute: '0',
    days: ['0','1','2','3','4','5','6'],
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('automation_schedules')
      .select('*')
      .order('schedule_name');

    if (!error && data) {
      setSchedules(data);
    }
    setLoading(false);
  };

  const parseCronExpression = (cron: string) => {
    const parts = cron.split(' ');
    if (parts.length !== 5) return { hour: '2', minute: '0', days: ['0','1','2','3','4','5','6'] };

    const minute = parts[0];
    const hour = parts[1];
    const dayOfWeek = parts[4];

    let days: string[] = [];
    if (dayOfWeek === '*') {
      days = ['0','1','2','3','4','5','6'];
    } else if (dayOfWeek.includes('-')) {
      const [start, end] = dayOfWeek.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        days.push(String(i));
      }
    } else if (dayOfWeek.includes(',')) {
      days = dayOfWeek.split(',');
    } else {
      days = [dayOfWeek];
    }

    return { hour, minute, days };
  };

  const buildCronExpression = (hour: string, minute: string, days: string[]) => {
    let dayOfWeek = '*';

    if (days.length === 7) {
      dayOfWeek = '*';
    } else if (days.length > 0) {
      const sortedDays = [...days].map(Number).sort((a, b) => a - b).map(String);
      dayOfWeek = sortedDays.join(',');
    }

    return `${minute} ${hour} * * ${dayOfWeek}`;
  };

  const handleEdit = (schedule: Schedule) => {
    const parsed = parseCronExpression(schedule.cron_expression);
    setFormData({
      schedule_name: schedule.schedule_name,
      function_name: schedule.function_name,
      cron_expression: schedule.cron_expression,
      description: schedule.description || '',
      hour: parsed.hour,
      minute: parsed.minute,
      days: parsed.days,
    });
    setEditingId(schedule.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cronExpression = buildCronExpression(formData.hour, formData.minute, formData.days);

    const scheduleData = {
      schedule_name: formData.schedule_name,
      function_name: formData.function_name,
      cron_expression: cronExpression,
      description: formData.description || null,
    };

    if (editingId) {
      await supabase
        .from('automation_schedules')
        .update(scheduleData)
        .eq('id', editingId);
    } else {
      await supabase
        .from('automation_schedules')
        .insert(scheduleData);
    }

    resetForm();
    loadSchedules();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 스케줄을 삭제하시겠습니까?')) return;

    await supabase
      .from('automation_schedules')
      .delete()
      .eq('id', id);

    loadSchedules();
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('automation_schedules')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    loadSchedules();
  };

  const resetForm = () => {
    setFormData({
      schedule_name: '',
      function_name: 'daily-automation',
      cron_expression: '0 2 * * *',
      description: '',
      hour: '2',
      minute: '0',
      days: ['0','1','2','3','4','5','6'],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const applyPreset = (preset: typeof PRESET_SCHEDULES[0]) => {
    setFormData({
      ...formData,
      cron_expression: preset.cron,
      hour: preset.hour,
      minute: preset.minute,
      days: preset.days,
    });
  };

  const toggleDay = (day: string) => {
    if (formData.days.includes(day)) {
      setFormData({
        ...formData,
        days: formData.days.filter(d => d !== day),
      });
    } else {
      setFormData({
        ...formData,
        days: [...formData.days, day].sort(),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">스케줄 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Clock className="text-blue-400" />
          자동화 스케줄 관리
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
        >
          <Plus size={18} />
          새 스케줄 추가
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                {editingId ? '스케줄 수정' : '새 스케줄 추가'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  스케줄 이름 *
                </label>
                <input
                  type="text"
                  value={formData.schedule_name}
                  onChange={(e) => setFormData({ ...formData, schedule_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 매일 새벽 콘텐츠 발행"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  실행 함수 *
                </label>
                <select
                  value={formData.function_name}
                  onChange={(e) => setFormData({ ...formData, function_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="daily-automation">일일 콘텐츠 자동화</option>
                  <option value="collect-seoul-buses">서울 버스 데이터 수집</option>
                  <option value="collect-gyeonggi-buses">경기 버스 데이터 수집</option>
                  <option value="verify-transport-data">교통 데이터 검증</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                placeholder="스케줄에 대한 설명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                프리셋 스케줄
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PRESET_SCHEDULES.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded-lg transition-colors text-sm"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  시간 *
                </label>
                <input
                  type="text"
                  value={formData.hour}
                  onChange={(e) => setFormData({ ...formData, hour: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0-23 또는 *"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">0-23 또는 * (매시간)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  분 *
                </label>
                <input
                  type="text"
                  value={formData.minute}
                  onChange={(e) => setFormData({ ...formData, minute: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0-59"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">0-59</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                실행 요일 *
              </label>
              <div className="flex gap-2">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                      formData.days.includes(day.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-300 mb-2">Cron 표현식</div>
              <code className="text-blue-400 font-mono">
                {buildCronExpression(formData.hour, formData.minute, formData.days)}
              </code>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
              >
                <Save size={18} />
                {editingId ? '수정' : '추가'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">스케줄명</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">실행 함수</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">Cron 표현식</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-white">상태</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-white">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    등록된 스케줄이 없습니다
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-semibold">{schedule.schedule_name}</div>
                      {schedule.description && (
                        <div className="text-sm text-gray-400 mt-1">{schedule.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {schedule.function_name}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm text-blue-400 font-mono">
                        {schedule.cron_expression}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleActive(schedule.id, schedule.is_active)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          schedule.is_active
                            ? 'bg-green-900 text-green-200'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        <Power size={14} />
                        {schedule.is_active ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(schedule)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
