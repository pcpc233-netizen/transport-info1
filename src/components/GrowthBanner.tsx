import { Share2, Users, TrendingUp } from 'lucide-react';

export default function GrowthBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl p-8 shadow-2xl mb-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-white bg-opacity-20 rounded-full p-4">
            <Users size={48} />
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
          🎉 한국 생활, 이제 쉬워집니다!
        </h2>

        <p className="text-xl md:text-2xl mb-6 text-white/90">
          공항버스부터 여권신청까지, 54,600개 생활정보를 무료로!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-4xl font-bold mb-2">54,600+</div>
            <div className="text-sm">정보 페이지</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-4xl font-bold mb-2">100%</div>
            <div className="text-sm">완전 무료</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-4xl font-bold mb-2">24/7</div>
            <div className="text-sm">언제나 이용</div>
          </div>
        </div>

        <div className="bg-yellow-400 text-gray-900 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <TrendingUp size={24} />
            <h3 className="text-xl font-bold">프리미엄 조기 액세스!</h3>
          </div>
          <p className="text-lg font-semibold mb-4">
            지금 친구에게 공유하면 프리미엄 출시 시 <span className="text-red-600">무료 3개월</span> 제공!
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                const url = window.location.href;
                const text = '한국 생활정보 54,600개! 공항버스부터 여권신청까지 모두 무료로 확인하세요!';
                const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(url)}`;
                window.open(kakaoUrl, '_blank', 'width=500,height=600');
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-8 py-4 rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <Share2 size={20} />
              카카오톡 공유
            </button>
            <button
              onClick={() => {
                const url = window.location.href;
                const naverUrl = `https://share.naver.com/web/shareView?url=${encodeURIComponent(url)}&title=${encodeURIComponent('한국 생활정보 54,600개!')}`;
                window.open(naverUrl, '_blank', 'width=500,height=600');
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <Share2 size={20} />
              네이버 공유
            </button>
          </div>
        </div>

        <div className="text-sm text-white/70">
          💡 공유하면 더 많은 사람들이 유용한 정보를 볼 수 있어요! (스팸 아닙니다)
        </div>
      </div>
    </div>
  );
}
