import { X, Share2, MessageCircle, Mail, Link2, Check } from 'lucide-react';
import { useState } from 'react';

interface ShareModalProps {
  service: {
    name: string;
    slug: string;
    description: string | null;
  };
  onClose: () => void;
}

export default function ShareModal({ service, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/service/${service.slug}`;
  const text = `${service.name} - ${service.description || '유용한 생활정보'}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleKakaoShare = () => {
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?app_key=YOUR_APP_KEY&validation_action=share&validation_params=${encodeURIComponent(JSON.stringify({ link_ver: '4.0', template_object: { object_type: 'feed', content: { title: service.name, description: service.description || '', link: { web_url: url, mobile_web_url: url } } } }))}`;
    window.open(kakaoUrl, '_blank', 'width=500,height=600');
  };

  const handleNaverShare = () => {
    const naverUrl = `https://share.naver.com/web/shareView?url=${encodeURIComponent(url)}&title=${encodeURIComponent(service.name)}`;
    window.open(naverUrl, '_blank', 'width=500,height=600');
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=500,height=600');
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=500,height=600');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(service.name);
    const body = encodeURIComponent(`${text}\n\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="text-blue-600" size={28} />
            <h2 className="text-2xl font-bold text-gray-900">공유하기</h2>
          </div>
          <p className="text-gray-600">친구들에게 유용한 정보를 공유해보세요!</p>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 mb-1">
              🎁 공유하고 혜택 받기!
            </div>
            <div className="text-sm text-gray-700">
              프리미엄 출시 시 무료 1개월 제공 (선착순)
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleKakaoShare}
            className="w-full flex items-center justify-center gap-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-6 py-4 rounded-lg transition-all"
          >
            <MessageCircle size={20} />
            카카오톡으로 공유
          </button>

          <button
            onClick={handleNaverShare}
            className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-4 rounded-lg transition-all"
          >
            <Share2 size={20} />
            네이버로 공유
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleTwitterShare}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-3 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              트위터
            </button>

            <button
              onClick={handleFacebookShare}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-3 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              페이스북
            </button>
          </div>

          <button
            onClick={handleEmailShare}
            className="w-full flex items-center justify-center gap-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-4 rounded-lg transition-all"
          >
            <Mail size={20} />
            이메일로 공유
          </button>

          <button
            onClick={handleCopyLink}
            className={`w-full flex items-center justify-center gap-3 font-semibold px-6 py-4 rounded-lg transition-all ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            {copied ? (
              <>
                <Check size={20} />
                링크 복사됨!
              </>
            ) : (
              <>
                <Link2 size={20} />
                링크 복사하기
              </>
            )}
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          공유하면 더 많은 사람들이 유용한 정보를 볼 수 있어요!
        </div>
      </div>
    </div>
  );
}
