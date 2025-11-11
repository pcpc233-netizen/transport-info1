import { MapPin, Clock, Bookmark, Eye } from 'lucide-react';
import { Service } from '../lib/types';

interface ServiceCardProps {
  service: Service;
  onClick: () => void;
  onBookmark: () => void;
  isBookmarked: boolean;
}

export default function ServiceCard({ service, onClick, onBookmark, isBookmarked }: ServiceCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden">
      {service.thumbnail_url && (
        <button onClick={onClick} className="w-full">
          <img
            src={service.thumbnail_url}
            alt={service.name}
            className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </button>
      )}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <button onClick={onClick} className="flex-1 text-left">
            <h3 className="font-semibold text-gray-900 text-lg hover:text-blue-600 transition-colors">
              {service.name}
            </h3>
            {service.service_number && (
              <span className="inline-block mt-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                {service.service_number}번
              </span>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark();
            }}
            className={`p-2 rounded-lg transition-colors ${
              isBookmarked
                ? 'bg-yellow-50 text-yellow-600'
                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
            }`}
          >
            <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {service.description}
        </p>

        <div className="space-y-2 text-sm">
          {service.operating_hours && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={16} className="text-gray-400" />
              <span>{service.operating_hours}</span>
            </div>
          )}
          {service.address && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={16} className="text-gray-400" />
              <span className="line-clamp-1">{service.address}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye size={14} />
              {service.view_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Bookmark size={14} />
              {service.bookmark_count.toLocaleString()}
            </span>
          </div>
          <button
            onClick={onClick}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            자세히 보기 →
          </button>
        </div>
      </div>
    </div>
  );
}
