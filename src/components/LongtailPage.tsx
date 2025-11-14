import { useEffect, useState } from 'react';
import { MapPin, Calendar, Tag, TrendingUp, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SEOHead from './SEOHead';

interface LongtailCombination {
  id: string;
  generated_title: string;
  generated_slug: string;
  search_volume: number;
  view_count: number;
  service: {
    id: string;
    name: string;
    description: string;
    long_description: string;
    operating_hours: string;
    address: string;
    phone: string;
    website_url: string;
  };
  location: {
    name: string;
    level: string;
  };
  action: {
    action: string;
  };
  season?: {
    name: string;
  };
}

interface LongtailPageProps {
  slug: string;
  onClose: () => void;
}

export default function LongtailPage({ slug, onClose }: LongtailPageProps) {
  const [combination, setCombination] = useState<LongtailCombination | null>(null);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<any>(null);

  useEffect(() => {
    loadCombination();
  }, [slug]);

  const loadCombination = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('longtail_combinations')
      .select(`
        *,
        service:services(*),
        location:keyword_locations(*),
        action:keyword_actions(*),
        season:keyword_seasons(*)
      `)
      .eq('generated_slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error) {
      console.error('Error loading combination:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setCombination(data as any);

      await supabase
        .from('longtail_combinations')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);

      if (data.service?.category_id) {
        const { data: templateData } = await supabase
          .from('content_templates')
          .select('*')
          .eq('category_id', data.service.category_id)
          .maybeSingle();

        if (templateData) {
          setTemplate(templateData);
        }
      }
    }

    setLoading(false);
  };

  const renderContent = () => {
    if (!combination || !template) return null;

    const { service, location, action, season } = combination;

    let content = template.content_template
      .replace(/{{location}}/g, location.name)
      .replace(/{{service}}/g, service.name)
      .replace(/{{action}}/g, action.action)
      .replace(/{{season}}/g, season?.name || '');

    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!combination) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">페이지를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">요청하신 페이지가 존재하지 않거나 삭제되었습니다.</p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const { service, location, action, season } = combination;
  const title = combination.generated_title;
  const description = template?.description_template
    ?.replace(/{{location}}/g, location.name)
    ?.replace(/{{service}}/g, service.name)
    ?.replace(/{{action}}/g, action.action)
    ?.replace(/{{season}}/g, season?.name || '') || service.description;

  return (
    <>
      <SEOHead
        title={title}
        description={description}
        keywords={[location.name, service.name, action.action, season?.name].filter(Boolean).join(', ')}
        ogType="article"
      />

      <div className="fixed inset-0 bg-white overflow-y-auto z-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={onClose}
            className="text-blue-600 hover:text-blue-700 font-medium mb-6 inline-flex items-center"
          >
            ← 홈으로 돌아가기
          </button>

          <article>
            <header className="mb-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {location && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    <MapPin size={14} />
                    {location.name}
                  </span>
                )}
                {action && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    <Tag size={14} />
                    {action.action}
                  </span>
                )}
                {season && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    <Calendar size={14} />
                    {season.name}
                  </span>
                )}
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <TrendingUp size={16} />
                  조회수 {combination.view_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  예상 검색량 {combination.search_volume || 0}
                </span>
              </div>
            </header>

            <div className="prose prose-lg max-w-none mb-8">
              {renderContent()}
            </div>

            {service && (
              <div className="mt-12 p-6 bg-gray-50 rounded-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">서비스 정보</h2>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">서비스명:</span>
                    <span className="ml-2 text-gray-900">{service.name}</span>
                  </div>
                  {service.operating_hours && (
                    <div>
                      <span className="font-semibold text-gray-700">운영시간:</span>
                      <span className="ml-2 text-gray-900">{service.operating_hours}</span>
                    </div>
                  )}
                  {service.address && (
                    <div>
                      <span className="font-semibold text-gray-700">주소:</span>
                      <span className="ml-2 text-gray-900">{service.address}</span>
                    </div>
                  )}
                  {service.phone && (
                    <div>
                      <span className="font-semibold text-gray-700">연락처:</span>
                      <span className="ml-2 text-gray-900">{service.phone}</span>
                    </div>
                  )}
                  {service.website_url && (
                    <div>
                      <a
                        href={service.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <Share2 size={16} />
                        공식 웹사이트 방문하기
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    </>
  );
}
