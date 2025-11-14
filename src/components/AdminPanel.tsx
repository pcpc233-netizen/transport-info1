import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ServiceCategory, Service } from '../lib/types';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [collectionResult, setCollectionResult] = useState<string>('');
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    service_number: '',
    description: '',
    long_description: '',
    operating_hours: '',
    address: '',
    slug: '',
    thumbnail_url: '',
    usage_tips: '',
    best_time: '',
    average_duration: ''
  });

  useEffect(() => {
    loadCategories();
    loadServices();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('service_categories')
      .select('*')
      .order('name');
    if (data) setCategories(data);
  };

  const loadServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setServices(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const slug = formData.slug ||
      `${formData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    if (editingService) {
      await supabase
        .from('services')
        .update({
          ...formData,
          slug,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingService.id);
    } else {
      await supabase
        .from('services')
        .insert({
          ...formData,
          slug
        });
    }

    setFormData({
      category_id: '',
      name: '',
      service_number: '',
      description: '',
      long_description: '',
      operating_hours: '',
      address: '',
      slug: '',
      thumbnail_url: '',
      usage_tips: '',
      best_time: '',
      average_duration: ''
    });
    setEditingService(null);
    setShowServiceForm(false);
    loadServices();
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      category_id: service.category_id,
      name: service.name,
      service_number: service.service_number || '',
      description: service.description || '',
      long_description: service.long_description || '',
      operating_hours: service.operating_hours || '',
      address: service.address || '',
      slug: service.slug,
      thumbnail_url: service.thumbnail_url || '',
      usage_tips: service.usage_tips || '',
      best_time: service.best_time || '',
      average_duration: service.average_duration || ''
    });
    setShowServiceForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);
      loadServices();
    }
  };

  const handleCancel = () => {
    setFormData({
      category_id: '',
      name: '',
      service_number: '',
      description: '',
      long_description: '',
      operating_hours: '',
      address: '',
      slug: '',
      thumbnail_url: '',
      usage_tips: '',
      best_time: '',
      average_duration: ''
    });
    setEditingService(null);
    setShowServiceForm(false);
  };

  const collectSeoulBuses = async () => {
    setCollecting(true);
    setCollectionResult('🚀 서울시 버스 데이터 수집 시작...\n⏳ 30초~1분 소요됩니다...');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/collect-seoul-buses`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            apiKey: 'da6a1b3be689e14556c3240efefa1e49cac3f2fb6b19571adb4b58afffc6aa14'
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        setCollectionResult(
          `✅ 성공!\n\n` +
          `📦 수집된 노선: ${result.collected}개\n` +
          `📝 메시지: ${result.message}\n\n` +
          `이제 페이지를 새로고침하면 새로운 버스 데이터를 볼 수 있습니다!`
        );

        await loadServices();
      } else {
        setCollectionResult(
          `❌ 실패\n\n` +
          `에러: ${result.error}\n\n` +
          JSON.stringify(result, null, 2)
        );
      }
    } catch (error: any) {
      setCollectionResult(
        `❌ 오류 발생\n\n` +
        `${error.message}\n\n` +
        `Edge Function이 배포되지 않았거나 API 키가 잘못되었을 수 있습니다.`
      );
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto">
      <div className="min-h-screen">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 px-6 py-6 flex justify-between items-center shadow-2xl sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
              <Edit size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">관리자 대시보드</h2>
              <p className="text-gray-400 text-sm mt-1">전국 교통정보 플랫폼 관리 시스템</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
            <div className="mb-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="bg-blue-600 px-4 py-2 rounded-lg">📋</span>
                  서비스 관리
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={collectSeoulBuses}
                    disabled={collecting}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 transition-all shadow-lg hover:shadow-xl disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold"
                  >
                    <Download size={20} />
                    {collecting ? '수집 중...' : '서울 버스 데이터 수집'}
                  </button>
                  <button
                    onClick={() => setShowServiceForm(!showServiceForm)}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl font-semibold"
                  >
                    <Plus size={20} />
                    새 서비스 추가
                  </button>
                </div>
              </div>

              {collectionResult && (
                <div className={`p-6 rounded-xl border-2 ${collecting ? 'bg-gray-700 border-blue-500' : collectionResult.includes('✅') ? 'bg-gray-700 border-green-500' : 'bg-gray-700 border-red-500'}`}>
                  <pre className="text-sm whitespace-pre-wrap font-mono text-gray-200">
                    {collectionResult}
                  </pre>
                  {!collecting && (
                    <button
                      onClick={() => setCollectionResult('')}
                      className="mt-3 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                    >
                      닫기
                    </button>
                  )}
                </div>
              )}
            </div>

            {showServiceForm && (
              <form onSubmit={handleSubmit} className="mb-8 bg-gray-700 rounded-xl p-8 space-y-6 border border-gray-600 shadow-xl">
                <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-2xl">{editingService ? '✏️' : '➕'}</span>
                  {editingService ? '서비스 수정' : '새 서비스 추가'}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      카테고리 *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-gray-600 border-2 border-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">선택하세요</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      서비스명 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-gray-600 border-2 border-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      서비스 번호
                    </label>
                    <input
                      type="text"
                      value={formData.service_number}
                      onChange={(e) => setFormData({ ...formData, service_number: e.target.value })}
                      placeholder="예: 8844"
                      className="w-full px-4 py-3 bg-gray-600 border-2 border-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      운영 시간
                    </label>
                    <input
                      type="text"
                      value={formData.operating_hours}
                      onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                      placeholder="예: 첫차 04:20 / 막차 22:40"
                      className="w-full px-4 py-3 bg-gray-600 border-2 border-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    주소
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-600 border-2 border-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    간단 설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="200자 이내 간단 설명"
                    className="w-full px-4 py-3 bg-gray-600 border-2 border-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    상세 설명 (SEO용 긴 설명)
                  </label>
                  <textarea
                    value={formData.long_description}
                    onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                    rows={6}
                    placeholder="800자 이상의 상세한 설명을 작성하세요. SEO에 중요합니다."
                    className="w-full px-4 py-3 bg-gray-600 border-2 border-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 border-2 border-gray-500 text-gray-200 rounded-xl hover:bg-gray-600 transition-colors font-semibold"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg font-semibold"
                  >
                    <Save size={18} />
                    {editingService ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-6 mt-8">
              <h4 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="bg-purple-600 px-4 py-2 rounded-lg">📊</span>
                등록된 서비스 ({services.length})
              </h4>
              <div className="bg-gray-700 border-2 border-gray-600 rounded-xl overflow-hidden shadow-xl">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white">서비스명</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white">번호</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white">조회수</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white">북마크</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white">등록일</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-white">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600">
                    {services.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-600 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-white">
                          {service.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {service.service_number || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {service.view_count}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {service.bookmark_count}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {new Date(service.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleEdit(service)}
                              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(service.id)}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-md"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
