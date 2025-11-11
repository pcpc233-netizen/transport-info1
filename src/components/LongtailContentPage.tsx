import { useEffect, useState } from 'react';
import { Bus, Clock, MapPin, Phone, ExternalLink, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SEOHead from './SEOHead';

interface ContentPage {
  id: string;
  title: string;
  slug: string;
  meta_description: string;
  content_html: string;
  keywords: string[];
  target_keyword: string;
  view_count: number;
}

interface LongtailContentPageProps {
  slug: string;
  onBack: () => void;
}

export default function LongtailContentPage({ slug, onBack }: LongtailContentPageProps) {
  const [content, setContent] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [slug]);

  const loadContent = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('longtail_content_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (data) {
      setContent(data);

      await supabase
        .from('longtail_content_pages')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bus className="animate-bounce mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bus className="mx-auto mb-4 text-gray-300" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">요청하신 페이지가 존재하지 않습니다.</p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={20} />
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={content.title}
        description={content.meta_description}
        keywords={content.keywords}
      />

      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft size={20} />
            메인으로 돌아가기
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Bus size={16} />
                <span>공항버스 정보</span>
                <span className="text-gray-400">·</span>
                <span>조회수 {content.view_count.toLocaleString()}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {content.title}
              </h1>
              <p className="text-lg text-gray-600">
                {content.meta_description}
              </p>
            </div>

            <div
              className="prose prose-lg max-w-none longtail-content"
              dangerouslySetInnerHTML={{ __html: content.content_html }}
            />

            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {content.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </article>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <Clock className="text-blue-600 mb-3" size={32} />
            <h3 className="font-bold text-gray-900 mb-2">실시간 정보</h3>
            <p className="text-sm text-gray-600">
              버스타고 앱에서 실시간 위치를 확인하세요
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
            <MapPin className="text-green-600 mb-3" size={32} />
            <h3 className="font-bold text-gray-900 mb-2">정류장 찾기</h3>
            <p className="text-sm text-gray-600">
              정류장 번호로 정확한 위치를 확인하세요
            </p>
          </div>
          <div className="bg-orange-50 rounded-xl p-6 border-2 border-orange-200">
            <Phone className="text-orange-600 mb-3" size={32} />
            <h3 className="font-bold text-gray-900 mb-2">문의하기</h3>
            <p className="text-sm text-gray-600">
              운행사에 직접 문의하실 수 있습니다
            </p>
          </div>
        </div>
      </main>

      <style>{`
        .longtail-content h2 {
          font-size: 1.75rem;
          font-weight: bold;
          color: #1f2937;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        .longtail-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #374151;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .longtail-content ul {
          list-style: disc;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }

        .longtail-content li {
          margin: 0.5rem 0;
          color: #4b5563;
        }

        .longtail-content p {
          margin: 1rem 0;
          line-height: 1.75;
          color: #4b5563;
        }

        .longtail-content .summary-box {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 1rem;
          margin: 1.5rem 0;
        }

        .longtail-content .summary-box h2 {
          color: white;
          margin-top: 0;
        }

        .longtail-content .summary-box ul {
          list-style: none;
          padding: 0;
        }

        .longtail-content .summary-box li {
          color: white;
          padding: 0.5rem 0;
        }

        .longtail-content .fare-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }

        .longtail-content .fare-table th,
        .longtail-content .fare-table td {
          border: 1px solid #e5e7eb;
          padding: 0.75rem;
          text-align: left;
        }

        .longtail-content .fare-table th {
          background: #f3f4f6;
          font-weight: 600;
          color: #1f2937;
        }

        .longtail-content .location-info {
          background: #f0fdf4;
          border-left: 4px solid #22c55e;
          padding: 1rem 1.5rem;
          margin: 1rem 0;
          border-radius: 0.5rem;
        }

        .longtail-content .booking-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 1rem 1.5rem;
          margin: 1rem 0;
          border-radius: 0.5rem;
        }

        .longtail-content .tips-section {
          background: #eff6ff;
          padding: 1.5rem;
          border-radius: 1rem;
          margin: 1.5rem 0;
        }

        .longtail-content .tip {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0.5rem 0;
        }

        .longtail-content a {
          color: #2563eb;
          text-decoration: underline;
        }

        .longtail-content a:hover {
          color: #1d4ed8;
        }
      `}</style>
    </div>
  );
}
