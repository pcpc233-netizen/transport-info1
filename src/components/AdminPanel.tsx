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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-xl">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
            <h2 className="text-2xl font-bold text-gray-900">관리자 패널</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">서비스 관리</h3>
                <div className="flex gap-2">
                  <button
                    onClick={collectSeoulBuses}
                    disabled={collecting}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Download size={20} />
                    {collecting ? '수집 중...' : '서울 버스 데이터 수집'}
                  </button>
                  <button
                    onClick={() => setShowServiceForm(!showServiceForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={20} />
                    새 서비스 추가
                  </button>
                </div>
              </div>

              {collectionResult && (
                <div className={`p-4 rounded-lg ${collecting ? 'bg-blue-50 border border-blue-200' : collectionResult.includes('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {collectionResult}
                  </pre>
                  {!collecting && (
                    <button
                      onClick={() => setCollectionResult('')}
                      className="mt-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      닫기
                    </button>
                  )}
                </div>
              )}
            </div>

            {showServiceForm && (
              <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 rounded-lg p-6 space-y-4">
                <h4 className="font-semibold text-gray-900 mb-4">
                  {editingService ? '서비스 수정' : '새 서비스 추가'}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      카테고리 *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      서비스명 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      서비스 번호
                    </label>
                    <input
                      type="text"
                      value={formData.service_number}
                      onChange={(e) => setFormData({ ...formData, service_number: e.target.value })}
                      placeholder="예: 8844"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      운영 시간
                    </label>
                    <input
                      type="text"
                      value={formData.operating_hours}
                      onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                      placeholder="예: 첫차 04:20 / 막차 22:40"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주소
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    간단 설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="200자 이내 간단 설명"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상세 설명 (SEO용 긴 설명)
                  </label>
                  <textarea
                    value={formData.long_description}
                    onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                    rows={6}
                    placeholder="800자 이상의 상세한 설명을 작성하세요. SEO에 중요합니다."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      썸네일 URL
                    </label>
                    <input
                      type="url"
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Unsplash, Pexels 등에서 무료 이미지 URL 사용</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      평균 소요시간
                    </label>
                    <input
                      type="text"
                      value={formData.average_duration}
                      onChange={(e) => setFormData({ ...formData, average_duration: e.target.value })}
                      placeholder="예: 70분 (60-90분)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      추천 이용시간
                    </label>
                    <input
                      type="text"
                      value={formData.best_time}
                      onChange={(e) => setFormData({ ...formData, best_time: e.target.value })}
                      placeholder="예: 평일 오전 10시~오후 4시"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이용 팁
                    </label>
                    <input
                      type="text"
                      value={formData.usage_tips}
                      onChange={(e) => setFormData({ ...formData, usage_tips: e.target.value })}
                      placeholder="예: 출발 20분 전 도착 권장"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save size={18} />
                    {editingService ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">등록된 서비스 ({services.length})</h4>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">서비스명</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">번호</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">조회수</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">북마크</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">등록일</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {services.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {service.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {service.service_number || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {service.view_count}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {service.bookmark_count}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(service.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(service)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(service.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={16} />
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
