import { Search, Bookmark, Menu } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onSearch: (query: string) => void;
  onShowBookmarks: () => void;
}

export default function Header({ onSearch, onShowBookmarks }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 ml-2 md:ml-0">
              생활정보 허브
            </h1>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4 hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="버스 번호, 지역, 서비스를 검색하세요..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </form>

          <button
            onClick={onShowBookmarks}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bookmark size={20} />
            <span className="hidden md:inline">북마크</span>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="검색..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
