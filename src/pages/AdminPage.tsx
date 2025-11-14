import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import AdminAuth from '../components/AdminAuth';
import AdminPanel from '../components/AdminPanel';
import AutomationDashboard from '../components/AutomationDashboard';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'panel' | 'automation'>('panel');

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_authenticated');
    const authTime = sessionStorage.getItem('admin_auth_time');

    if (auth && authTime) {
      const elapsed = Date.now() - parseInt(authTime);
      if (elapsed < 3600000) {
        setIsAuthenticated(true);
      } else {
        sessionStorage.removeItem('admin_authenticated');
        sessionStorage.removeItem('admin_auth_time');
      }
    }
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_auth_time');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <AdminAuth
        onAuthenticated={handleAuthenticated}
        onCancel={() => window.location.href = '/'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl">
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
                <p className="text-sm text-gray-600">시스템 관리 및 자동화</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setActiveTab('panel')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'panel'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            관리자 패널
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'automation'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            자동화 대시보드
          </button>
        </div>

        {activeTab === 'panel' ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <AdminPanel onClose={() => {}} />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <AutomationDashboard onClose={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
}
