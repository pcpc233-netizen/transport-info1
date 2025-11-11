import { useEffect, useRef, useState } from 'react';

interface CoupangAdProps {
  className?: string;
}

declare global {
  interface Window {
    PartnersCoupang?: any;
  }
}

export default function CoupangAd({ className = '' }: CoupangAdProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    let timeoutId: number;

    const loadCoupangScript = () => {
      const existingScript = document.querySelector('script[src*="ads-partners.coupang.com"]');

      if (existingScript) {
        initializeCoupangAd();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://ads-partners.coupang.com/g.js';
      script.async = true;
      script.onload = () => {
        timeoutId = window.setTimeout(() => {
          initializeCoupangAd();
        }, 100);
      };
      script.onerror = () => {
        console.error('쿠팡 광고 스크립트 로딩 실패');
        setAdError(true);
      };
      document.head.appendChild(script);
    };

    const initializeCoupangAd = () => {
      if (!adContainerRef.current) return;

      try {
        if (window.PartnersCoupang) {
          new window.PartnersCoupang.G({
            id: 839281,
            trackingCode: "AF1745627",
            subId: null,
            template: "carousel",
            width: "680",
            height: "140"
          });
          setAdLoaded(true);
          console.log('쿠팡 광고 로딩 성공');
        } else {
          console.warn('PartnersCoupang 객체를 찾을 수 없습니다');
          timeoutId = window.setTimeout(initializeCoupangAd, 500);
        }
      } catch (error) {
        console.error('쿠팡 광고 초기화 실패:', error);
        setAdError(true);
      }
    };

    loadCoupangScript();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <div className={`my-6 ${className}`}>
      <div className="text-center mb-2">
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          파트너스 활동으로 일정액의 수수료를 제공받습니다
        </span>
      </div>
      <div
        ref={adContainerRef}
        id={`coupang-ad-${Math.random().toString(36).substr(2, 9)}`}
        className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200 flex items-center justify-center min-h-[180px] overflow-hidden"
      >
        {!adLoaded && !adError && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
            <div className="text-orange-600 font-semibold text-sm">광고 로딩 중...</div>
          </div>
        )}
        {adError && (
          <div className="text-center">
            <div className="text-orange-600 font-bold text-lg mb-2">쿠팡 파트너스</div>
            <div className="text-gray-600 text-sm">추천 상품 보러가기</div>
            <a
              href="https://www.coupang.com/np/campaigns/82"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-semibold"
            >
              쿠팡 바로가기
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
