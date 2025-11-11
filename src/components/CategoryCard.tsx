import * as Icons from 'lucide-react';
import { ServiceCategory } from '../lib/types';

interface CategoryCardProps {
  category: ServiceCategory;
  onClick: () => void;
}

export default function CategoryCard({ category, onClick }: CategoryCardProps) {
  const IconComponent = (Icons as any)[category.icon] || Icons.Info;

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 text-left group border border-gray-100 hover:border-blue-300"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
          <IconComponent className="text-blue-600" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
            {category.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {category.description}
          </p>
          <div className="mt-3 text-xs text-gray-500">
            조회수 {category.view_count.toLocaleString()}
          </div>
        </div>
      </div>
    </button>
  );
}
