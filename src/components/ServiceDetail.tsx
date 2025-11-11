import { useState, useEffect } from 'react';
import {
  X, Clock, MapPin, Plane, Share2, AlertCircle, Bus, Phone, Navigation
} from 'lucide-react';
import { Service } from '../lib/types';
import { supabase } from '../lib/supabase';
import ShareModal from './ShareModal';
import BusRealtimeInfo from './BusRealtimeInfo';
import CoupangAd from './CoupangAd';

interface ServiceDetailProps {
  service: Service;
  onClose: () => void;
}

export default function ServiceDetail({ service, onClose }: ServiceDetailProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const isBusService = service.name.includes('버스') || service.service_number;

  useEffect(() => {
    incrementViewCount();
  }, [service.id]);

  const incrementViewCount = async () => {
    await supabase
      .from('services')
      .update({ view_count: service.view_count + 1 })
      .eq('id', service.id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 md:p-6 rounded-t-2xl z-10 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isBusService ? <Bus size={28} /> : <Plane size={28} />}
                <h2 className="text-2xl md:text-3xl font-bold">{service.name}</h2>
              </div>
              <p className="text-blue-100 text-xs md:text-sm">2025년 최신 정보 | 실시간 업데이트</p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => setShowShareModal(true)}
                className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Share2 size={20} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {service.long_description && (
            <section className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 md:p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2 text-base md:text-lg">최종 업데이트</h3>
                  <div className="text-gray-700 text-sm md:text-base space-y-1 leading-relaxed">
                    {service.long_description.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          <CoupangAd />

          <section className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-5 py-3 border-b-2 border-gray-200">
              <h3 className="font-bold text-gray-900 text-base md:text-lg">주요 운행 정보</h3>
            </div>
            <div className="p-4 md:p-5">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {service.operating_hours && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-blue-600" size={20} />
                        <span className="text-xs md:text-sm text-gray-600 font-medium">첫차</span>
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-gray-900">
                        {service.operating_hours.split('/')[0]?.trim() || '04:30'}
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 md:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-orange-600" size={20} />
                        <span className="text-xs md:text-sm text-gray-600 font-medium">막차</span>
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-gray-900">
                        {service.operating_hours.split('/')[1]?.trim() || '23:00'}
                      </div>
                    </div>
                  </>
                )}

                {service.average_duration && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 md:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="text-purple-600" size={20} />
                      <span className="text-xs md:text-sm text-gray-600 font-medium">소요시간</span>
                    </div>
                    <div className="text-lg md:text-xl font-bold text-gray-900">{service.average_duration}</div>
                  </div>
                )}

                {service.difficulty_level && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bus className="text-green-600" size={20} />
                      <span className="text-xs md:text-sm text-gray-600 font-medium">일일 운행</span>
                    </div>
                    <div className="text-lg md:text-xl font-bold text-gray-900">{service.difficulty_level}</div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {isBusService && service.service_number && (
            <>
              <CoupangAd />

              <section className="bg-white rounded-xl border-2 border-blue-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 md:px-5 py-3 md:py-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Navigation size={24} />
                    <div>
                      <h3 className="text-lg md:text-xl font-bold">실시간 버스 정보</h3>
                      <p className="text-blue-100 text-xs md:text-sm mt-0.5">정류장 클릭 시 도착 시간 확인</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 md:p-5">
                  <BusRealtimeInfo busNumber={service.service_number} />
                </div>
              </section>
            </>
          )}

          <CoupangAd />

          {(service.usage_tips || service.best_time || service.phone || service.address) && (
            <section className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-5 py-3 border-b-2 border-gray-200">
                <h3 className="font-bold text-gray-900 text-base md:text-lg">상세 정보</h3>
              </div>
              <div className="p-4 md:p-5 space-y-3 md:space-y-4">
                {service.usage_tips && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                    <h4 className="font-bold text-gray-900 mb-2 text-sm md:text-base flex items-center gap-2">
                      <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">!</span>
                      이용 팁
                    </h4>
                    <div className="text-gray-700 text-sm md:text-base space-y-1.5 leading-relaxed">
                      {service.usage_tips.split('\n').map((tip, idx) => (
                        <p key={idx} className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold mt-0.5">•</span>
                          <span className="flex-1">{tip}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {service.best_time && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
                    <h4 className="font-bold text-gray-900 mb-2 text-sm md:text-base">추천 이용 시간</h4>
                    <p className="text-gray-700 text-sm md:text-base leading-relaxed">{service.best_time}</p>
                  </div>
                )}

                {service.phone && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 md:p-4">
                    <h4 className="font-bold text-gray-900 mb-2 text-sm md:text-base flex items-center gap-2">
                      <Phone size={18} />
                      문의 전화
                    </h4>
                    <a
                      href={`tel:${service.phone}`}
                      className="text-blue-600 hover:text-blue-700 font-semibold text-base md:text-lg inline-flex items-center gap-2"
                    >
                      {service.phone}
                    </a>
                  </div>
                )}

                {service.address && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 md:p-4">
                    <h4 className="font-bold text-gray-900 mb-2 text-sm md:text-base flex items-center gap-2">
                      <MapPin size={18} />
                      주소
                    </h4>
                    <p className="text-gray-700 text-sm md:text-base leading-relaxed">{service.address}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="bg-amber-50 border border-amber-300 rounded-lg p-4 md:p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2 text-sm md:text-base">이용 안내</h3>
                <ul className="space-y-1.5 text-gray-700 text-xs md:text-sm leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold mt-0.5">•</span>
                    <span className="flex-1">실시간 정보는 교통 상황에 따라 변동될 수 있습니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold mt-0.5">•</span>
                    <span className="flex-1">출발 전 최신 정보를 확인하시기 바랍니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold mt-0.5">•</span>
                    <span className="flex-1">정확한 정보는 고객센터로 문의해 주시기 바랍니다</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <CoupangAd />
        </div>
      </div>

      {showShareModal && (
        <ShareModal
          service={service}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
