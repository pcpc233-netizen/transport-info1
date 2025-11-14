import { useState, useEffect } from 'react';
import { Bus, Search, TrendingUp, Clock, MapPin, Activity, Train, Plane } from 'lucide-react';
import ServiceDetail from './components/ServiceDetail';
import LongtailContentPage from './components/LongtailContentPage';
import { supabase } from './lib/supabase';
import { Service } from './lib/types';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

interface LongtailContent {
  id: string;
  title: string;
  slug: string;
  meta_description: string;
  keywords: string[];
  view_count: number;
}

function App() {
  const [buses, setBuses] = useState<Service[]>([]);
  const [filteredBuses, setFilteredBuses] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [longtailPages, setLongtailPages] = useState<LongtailContent[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [longtailSlug, setLongtailSlug] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, updated: 0 });

  useEffect(() => {
    loadBuses();
    loadCategories();
    loadLongtailPages();
    loadStats();

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('page/')) {
        const slug = hash.replace('page/', '');
        setLongtailSlug(slug);
      } else {
        setLongtailSlug(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = buses.filter(bus =>
        bus.service_number?.includes(searchQuery) ||
        bus.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bus.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBuses(filtered);
    } else {
      setFilteredBuses(buses);
    }
  }, [searchQuery, buses]);

  const loadBuses = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .not('service_number', 'is', null)
        .order('service_number');

      if (error) {
        console.error('Error loading buses:', error);
        return;
      }

      if (data) {
        setBuses(data);
        setFilteredBuses(data);
      }
    } catch (error) {
      console.error('Failed to load buses:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadLongtailPages = async () => {
    try {
      const { data, error } = await supabase
        .from('longtail_content_pages')
        .select('id, title, slug, meta_description, keywords, view_count')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading longtail pages:', error);
        return;
      }

      if (data) {
        setLongtailPages(data);
      }
    } catch (error) {
      console.error('Failed to load longtail pages:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { count: total, error: totalError } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .not('service_number', 'is', null);

      if (totalError) {
        console.error('Error loading total stats:', totalError);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: updated, error: updatedError } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .not('service_number', 'is', null)
        .gte('updated_at', today.toISOString());

      if (updatedError) {
        console.error('Error loading updated stats:', updatedError);
        return;
      }

      setStats({
        total: total || 0,
        updated: updated || 0
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const groupBusesByRegion = () => {
    const regionOrder = [
      '서울 간선버스',
      '서울 지선버스',
      '서울 광역버스',
      '서울 마을버스',
      '서울 공항버스',
      '경기 버스',
      '인천 버스',
      '기타 지역'
    ];

    const groups: { [key: string]: Service[] } = {};
    regionOrder.forEach(region => {
      groups[region] = [];
    });

    filteredBuses.forEach(bus => {
      const keywords = bus.seo_keywords || [];
      const name = bus.name || '';
      const desc = bus.description || '';

      if (keywords.includes('공항') || name.includes('공항')) {
        groups['서울 공항버스'].push(bus);
      } else if (keywords.includes('마을') || name.includes('마을')) {
        groups['서울 마을버스'].push(bus);
      } else if (keywords.includes('간선') || name.includes('간선')) {
        groups['서울 간선버스'].push(bus);
      } else if (keywords.includes('지선') || name.includes('지선')) {
        groups['서울 지선버스'].push(bus);
      } else if (keywords.includes('광역') || name.includes('광역')) {
        groups['서울 광역버스'].push(bus);
      } else if (keywords.includes('경기') || name.includes('경기') || desc.includes('경기')) {
        groups['경기 버스'].push(bus);
      } else if (keywords.includes('인천') || name.includes('인천') || desc.includes('인천')) {
        groups['인천 버스'].push(bus);
      } else {
        groups['기타 지역'].push(bus);
      }
    });

    return regionOrder
      .map(region => [region, groups[region]] as [string, Service[]])
      .filter(([_, buses]) => buses.length > 0);
  };

  if (longtailSlug) {
    return (
      <LongtailContentPage
        slug={longtailSlug}
        onBack={() => {
          window.location.hash = '';
          setLongtailSlug(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
                <Bus className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  전국 교통정보 플랫폼
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  <Activity className="inline mr-1" size={14} />
                  고속버스 · 시외버스 · GTX · 지하철 시간표
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-gray-600">등록된 노선</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{stats.updated}</div>
                <div className="text-xs text-gray-600">오늘 업데이트</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="지역, 노선, 버스 번호를 검색하세요 (예: 서울 고속버스, GTX, 160번)"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!searchQuery && categories.length > 0 && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">교통 카테고리</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {categories.map((category) => {
                  const iconMap: { [key: string]: any } = {
                    bus: Bus,
                    train: Train,
                    plane: Plane,
                  };
                  const IconComponent = iconMap[category.icon] || Bus;

                  return (
                    <div
                      key={category.id}
                      className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-500 rounded-xl p-6 transition-all cursor-pointer group shadow-sm hover:shadow-lg"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="bg-blue-100 group-hover:bg-blue-200 p-3 rounded-full mb-3 transition-colors">
                          <IconComponent className="text-blue-600" size={24} />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm mb-1">{category.name}</h3>
                        <p className="text-xs text-gray-600 line-clamp-2">{category.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                <Clock size={32} className="mb-3" />
                <h3 className="text-xl font-bold mb-2">지역별 시간표</h3>
                <p className="text-blue-100 text-sm">
                  전국 모든 지역의 교통 시간표를 확인하세요
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                <MapPin size={32} className="mb-3" />
                <h3 className="text-xl font-bold mb-2">노선 정보</h3>
                <p className="text-green-100 text-sm">
                  상세한 노선도와 정류장 위치 정보
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
                <TrendingUp size={32} className="mb-3" />
                <h3 className="text-xl font-bold mb-2">실시간 업데이트</h3>
                <p className="text-orange-100 text-sm">
                  매일 자동으로 최신 정보가 업데이트됩니다
                </p>
              </div>
            </div>

            {longtailPages.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">인기 노선 가이드</h2>
                  <span className="text-sm text-gray-600">실제 이용자들이 많이 찾는 정보</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {longtailPages.map((page) => (
                    <a
                      key={page.id}
                      href={`#page/${page.slug}`}
                      className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-500 rounded-xl p-5 transition-all group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 group-hover:bg-blue-200 p-2 rounded-lg transition-colors flex-shrink-0">
                          <Bus className="text-blue-600" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {page.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {page.meta_description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Activity size={12} />
                            <span>{page.view_count.toLocaleString()}회 조회</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {searchQuery && filteredBuses.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <Bus size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-600">
              "{searchQuery}"에 해당하는 버스를 찾을 수 없습니다
            </p>
          </div>
        )}

        {groupBusesByRegion().map(([region, regionBuses]) => (
          <div key={region} className="mb-10">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="text-white" size={28} />
                  <div>
                    <h2 className="text-2xl font-bold text-white">{region}</h2>
                    <p className="text-blue-100 text-sm mt-1">
                      {regionBuses.length}개 노선 운행 중
                    </p>
                  </div>
                </div>
                <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div className="text-white text-lg font-bold">
                    {regionBuses.length}
                  </div>
                  <div className="text-blue-100 text-xs">노선</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {regionBuses.map((bus) => (
                <button
                  key={bus.id}
                  onClick={() => setSelectedService(bus)}
                  className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-500 rounded-xl p-4 transition-all transform hover:scale-105 hover:shadow-lg group"
                >
                  <div className="flex flex-col items-center">
                    <Bus className="text-blue-600 group-hover:text-blue-700 mb-2" size={28} />
                    <div className="text-xl font-bold text-gray-900 mb-1">
                      {bus.service_number}
                    </div>
                    <div className="text-xs text-gray-600 text-center line-clamp-2">
                      {bus.description}
                    </div>
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      상세보기 →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {!searchQuery && filteredBuses.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <Bus size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              아직 등록된 버스가 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              관리자 패널에서 버스 정보를 수집하세요
            </p>
            <a
              href="#bus-test"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Bus size={20} />
              버스 데이터 수집하기
            </a>
          </div>
        )}
      </main>

      {selectedService && (
        <ServiceDetail
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 text-sm">
            <p className="mb-2 font-semibold text-gray-900">전국 교통정보 통합 플랫폼</p>
            <p className="mb-1">고속버스·시외버스·GTX·지하철 시간표 및 노선 정보 제공</p>
            <p className="text-xs text-gray-500">매일 자동 업데이트 · 실시간 정보 제공</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
