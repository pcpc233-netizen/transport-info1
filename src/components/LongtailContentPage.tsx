import { useEffect, useState } from 'react';
import { Bus, Clock, MapPin, Phone, ExternalLink, ArrowLeft, Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SEOHead from './SEOHead';

function parseMarkdown(markdown: string): string {
  let html = markdown;

  // 제목 (H1-H6)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 굵은 글씨
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 기울임
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // 링크
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>');

  // 테이블
  const tableRegex = /\|(.+)\|\n\|[-: |]+\|\n((?:\|.+\|\n?)+)/g;
  html = html.replace(tableRegex, (match) => {
    const lines = match.trim().split('\n');
    const headers = lines[0].split('|').filter(Boolean).map(h => h.trim());
    const rows = lines.slice(2).map(row =>
      row.split('|').filter(Boolean).map(cell => cell.trim())
    );

    let table = '<table class="min-w-full border border-gray-200 my-4"><thead class="bg-gray-50"><tr>';
    headers.forEach(h => {
      table += `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">${h}</th>`;
    });
    table += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';
    rows.forEach(row => {
      table += '<tr>';
      row.forEach(cell => {
        table += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cell}</td>`;
      });
      table += '</tr>';
    });
    table += '</tbody></table>';
    return table;
  });

  // 리스트
  html = html.replace(/^\- (.+)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside my-4 space-y-2">$1</ul>');

  // 단락
  html = html.replace(/\n\n/g, '</p><p class="mb-4">');
  html = '<p class="mb-4">' + html + '</p>';

  return html;
}

interface ContentPage {
  id: string;
  title: string;
  slug: string;
  meta_description: string;
  content: string;
  content_html: string;
  keywords: string[];
  target_keyword: string;
  view_count: number;
  service_id?: string;
}

interface ServiceData {
  service_number: string;
  name: string;
  operating_hours: string;
}

interface LongtailContentPageProps {
  slug: string;
  onBack: () => void;
}

export default function LongtailContentPage({ slug, onBack }: LongtailContentPageProps) {
  const [content, setContent] = useState<ContentPage | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [slug]);

  const loadContent = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('longtail_content_pages')
      .select('*, services(service_number, name, operating_hours)')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (data) {
      setContent(data);
      if (data.services) {
        setServiceData(data.services as any);
      }

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
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            메인으로 돌아가기
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <article className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                <Bus size={14} className="sm:w-4 sm:h-4" />
                <span>공항버스 정보</span>
                <span className="text-gray-400">·</span>
                <span>조회수 {content.view_count.toLocaleString()}</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                {content.title}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                {content.meta_description}
              </p>
            </div>

            <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none longtail-content">
              {content.content ? (
                <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content.content) }} />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: content.content_html || '' }} />
              )}
            </div>

            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {content.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium"
                  >
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </article>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <a
            href={`https://map.naver.com/p/search/${encodeURIComponent(content.target_keyword || content.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-50 hover:bg-blue-100 rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-blue-200 hover:border-blue-400 transition-all cursor-pointer group"
          >
            <Clock className="text-blue-600 group-hover:scale-110 transition-transform mb-2 sm:mb-3" size={24} />
            <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2 text-sm sm:text-base">
              실시간 정보
              <ExternalLink size={14} className="text-blue-600 sm:w-4 sm:h-4" />
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              네이버 지도에서 실시간 위치를 확인하세요
            </p>
          </a>
          <a
            href={`https://map.kakao.com/link/search/${encodeURIComponent(content.target_keyword || content.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-50 hover:bg-green-100 rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-green-200 hover:border-green-400 transition-all cursor-pointer group"
          >
            <MapPin className="text-green-600 group-hover:scale-110 transition-transform mb-2 sm:mb-3" size={24} />
            <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2 text-sm sm:text-base">
              정류장 찾기
              <ExternalLink size={14} className="text-green-600 sm:w-4 sm:h-4" />
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              카카오맵에서 정류장 위치를 확인하세요
            </p>
          </a>
          <a
            href="tel:1330"
            className="bg-orange-50 hover:bg-orange-100 rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-orange-200 hover:border-orange-400 transition-all cursor-pointer group"
          >
            <Phone className="text-orange-600 group-hover:scale-110 transition-transform mb-2 sm:mb-3" size={24} />
            <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2 text-sm sm:text-base">
              문의하기
              <Phone size={14} className="text-orange-600 sm:w-4 sm:h-4" />
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              1330 관광안내전화로 문의하세요
            </p>
          </a>
        </div>
      </main>

      <style>{`
        .longtail-content h2 {
          font-size: 1.25rem;
          font-weight: bold;
          color: #1f2937;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        @media (min-width: 640px) {
          .longtail-content h2 {
            font-size: 1.5rem;
            margin-top: 2rem;
            margin-bottom: 1rem;
          }
        }

        @media (min-width: 768px) {
          .longtail-content h2 {
            font-size: 1.75rem;
          }
        }

        .longtail-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        @media (min-width: 640px) {
          .longtail-content h3 {
            font-size: 1.25rem;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
          }
        }

        @media (min-width: 768px) {
          .longtail-content h3 {
            font-size: 1.5rem;
          }
        }

        .longtail-content ul {
          list-style: disc;
          padding-left: 1.25rem;
          margin: 0.75rem 0;
        }

        @media (min-width: 640px) {
          .longtail-content ul {
            padding-left: 1.5rem;
            margin: 1rem 0;
          }
        }

        .longtail-content li {
          margin: 0.375rem 0;
          color: #4b5563;
          line-height: 1.6;
        }

        @media (min-width: 640px) {
          .longtail-content li {
            margin: 0.5rem 0;
          }
        }

        .longtail-content p {
          margin: 0.75rem 0;
          line-height: 1.65;
          color: #4b5563;
          font-size: 0.9375rem;
        }

        @media (min-width: 640px) {
          .longtail-content p {
            margin: 1rem 0;
            line-height: 1.75;
            font-size: 1rem;
          }
        }

        .longtail-content .summary-box {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 1rem;
          border-radius: 0.75rem;
          margin: 1rem 0;
        }

        @media (min-width: 640px) {
          .longtail-content .summary-box {
            padding: 1.5rem;
            border-radius: 1rem;
            margin: 1.5rem 0;
          }
        }

        .longtail-content .summary-box h2 {
          color: white;
          margin-top: 0;
          font-size: 1.125rem;
        }

        @media (min-width: 640px) {
          .longtail-content .summary-box h2 {
            font-size: 1.5rem;
          }
        }

        .longtail-content .summary-box ul {
          list-style: none;
          padding: 0;
        }

        .longtail-content .summary-box li {
          color: white;
          padding: 0.375rem 0;
          font-size: 0.875rem;
        }

        @media (min-width: 640px) {
          .longtail-content .summary-box li {
            padding: 0.5rem 0;
            font-size: 1rem;
          }
        }

        .longtail-content .fare-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 0.875rem;
          overflow-x: auto;
          display: block;
        }

        @media (min-width: 640px) {
          .longtail-content .fare-table {
            font-size: 1rem;
            display: table;
          }
        }

        .longtail-content .fare-table th,
        .longtail-content .fare-table td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
          text-align: left;
        }

        @media (min-width: 640px) {
          .longtail-content .fare-table th,
          .longtail-content .fare-table td {
            padding: 0.75rem;
          }
        }

        .longtail-content .fare-table th {
          background: #f3f4f6;
          font-weight: 600;
          color: #1f2937;
        }

        .longtail-content .location-info {
          background: #f0fdf4;
          border-left: 4px solid #22c55e;
          padding: 0.75rem 1rem;
          margin: 0.75rem 0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        @media (min-width: 640px) {
          .longtail-content .location-info {
            padding: 1rem 1.5rem;
            margin: 1rem 0;
            font-size: 1rem;
          }
        }

        .longtail-content .booking-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 0.75rem 1rem;
          margin: 0.75rem 0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        @media (min-width: 640px) {
          .longtail-content .booking-box {
            padding: 1rem 1.5rem;
            margin: 1rem 0;
            font-size: 1rem;
          }
        }

        .longtail-content .tips-section {
          background: #eff6ff;
          padding: 1rem;
          border-radius: 0.75rem;
          margin: 1rem 0;
        }

        @media (min-width: 640px) {
          .longtail-content .tips-section {
            padding: 1.5rem;
            border-radius: 1rem;
            margin: 1.5rem 0;
          }
        }

        .longtail-content .tip {
          color: #6b7280;
          font-size: 0.8125rem;
          margin: 0.375rem 0;
        }

        @media (min-width: 640px) {
          .longtail-content .tip {
            font-size: 0.875rem;
            margin: 0.5rem 0;
          }
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
