import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit, Eye, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Content {
  id: string;
  slug: string;
  title: string;
  content_type: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  meta_description?: string;
  page_content?: string;
  views?: number;
  category?: string;
}

export default function ContentManagement() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPublished, setFilterPublished] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('longtail_content_pages')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      if (data) setContents(data);
    } catch (error) {
      console.error('Failed to load contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteContent = async (id: string) => {
    if (!confirm('정말로 이 콘텐츠를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('longtail_content_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContents(contents.filter(c => c.id !== id));
      alert('콘텐츠가 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete content:', error);
      alert('삭제 실패');
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('longtail_content_pages')
        .update({ is_published: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setContents(contents.map(c =>
        c.id === id ? { ...c, is_published: !currentStatus } : c
      ));
    } catch (error) {
      console.error('Failed to toggle publish:', error);
      alert('상태 변경 실패');
    }
  };

  const openEditModal = (content: Content) => {
    setEditingContent(content);
    setEditTitle(content.title);
    setEditDescription(content.meta_description || '');
    setEditContent(content.page_content || '');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingContent(null);
    setEditTitle('');
    setEditDescription('');
    setEditContent('');
  };

  const saveEdit = async () => {
    if (!editingContent) return;

    try {
      const { error } = await supabase
        .from('longtail_content_pages')
        .update({
          title: editTitle,
          meta_description: editDescription,
          page_content: editContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingContent.id);

      if (error) throw error;

      setContents(contents.map(c =>
        c.id === editingContent.id
          ? { ...c, title: editTitle, meta_description: editDescription, page_content: editContent }
          : c
      ));

      alert('콘텐츠가 수정되었습니다.');
      closeEditModal();
    } catch (error) {
      console.error('Failed to save edit:', error);
      alert('수정 실패');
    }
  };

  const filteredContents = contents.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || content.content_type === filterType;
    const matchesPublished = filterPublished === 'all' ||
                            (filterPublished === 'published' && content.is_published) ||
                            (filterPublished === 'draft' && !content.is_published);
    const matchesCategory = filterCategory === 'all' || content.category === filterCategory;

    return matchesSearch && matchesType && matchesPublished && matchesCategory;
  });

  const contentTypes = Array.from(new Set(contents.map(c => c.content_type)));
  const categories = Array.from(new Set(contents.map(c => c.category).filter(Boolean)));
  const totalViews = filteredContents.reduce((sum, c) => sum + (c.views || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">콘텐츠 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="text-blue-400" />
          콘텐츠 관리
        </h2>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={20} />
          새 콘텐츠
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="제목, 슬러그 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 유형</option>
              {contentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={filterPublished}
              onChange={(e) => setFilterPublished(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 상태</option>
              <option value="published">발행됨</option>
              <option value="draft">초안</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 카테고리</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">총 콘텐츠</div>
          <div className="text-2xl font-bold text-white">{filteredContents.length}개</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">발행된 콘텐츠</div>
          <div className="text-2xl font-bold text-green-400">
            {filteredContents.filter(c => c.is_published).length}개
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">총 조회수</div>
          <div className="text-2xl font-bold text-blue-400">{totalViews.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">

        {filteredContents.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText className="mx-auto mb-4 text-gray-500" size={48} />
            <p className="text-lg mb-2">콘텐츠가 없습니다</p>
            <p className="text-sm">
              "시스템" 탭에서 자동화를 실행하여 콘텐츠를 생성하세요
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredContents.map((content) => (
              <div
                key={content.id}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-medium truncate">
                        {content.title}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        content.is_published
                          ? 'bg-green-900 text-green-200'
                          : 'bg-yellow-900 text-yellow-200'
                      }`}>
                        {content.is_published ? '발행됨' : '초안'}
                      </span>
                      <span className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs">
                        {content.content_type}
                      </span>
                    </div>

                    <p className="text-gray-400 text-sm mb-2 truncate">
                      /{content.slug}
                    </p>

                    {content.meta_description && (
                      <p className="text-gray-500 text-xs line-clamp-2">
                        {content.meta_description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>생성: {new Date(content.created_at).toLocaleDateString('ko-KR')}</span>
                      <span>수정: {new Date(content.updated_at).toLocaleDateString('ko-KR')}</span>
                      {content.views !== undefined && (
                        <span className="text-blue-400 font-medium">
                          조회: {content.views.toLocaleString()}회
                        </span>
                      )}
                      {content.category && (
                        <span className="px-2 py-0.5 bg-purple-900 text-purple-200 rounded">
                          {content.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePublish(content.id, content.is_published)}
                      className="p-2 bg-gray-600 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      title={content.is_published ? '발행 취소' : '발행'}
                    >
                      <Eye size={18} />
                    </button>

                    <button
                      onClick={() => openEditModal(content)}
                      className="p-2 bg-gray-600 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                      title="수정"
                    >
                      <Edit size={18} />
                    </button>

                    <button
                      onClick={() => deleteContent(content.id)}
                      className="p-2 bg-gray-600 hover:bg-red-600 text-white rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditModal && editingContent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6">
              <h3 className="text-xl font-bold text-white">콘텐츠 수정</h3>
              <p className="text-sm text-gray-400 mt-1">/{editingContent.slug}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="콘텐츠 제목"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  메타 설명
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SEO용 메타 설명"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  본문 내용
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={15}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="콘텐츠 본문 (HTML 가능)"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex gap-3">
              <button
                onClick={closeEditModal}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
