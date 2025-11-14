import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import AdminDashboard from './components/AdminDashboard';

export default function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'email' | 'code'>('email');
  const [recoveryMessage, setRecoveryMessage] = useState('');

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const sessionToken = sessionStorage.getItem('admin_session_token');

    if (sessionToken) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-verify-session`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionToken }),
          }
        );

        if (!response.ok) {
          throw new Error('Session verification failed');
        }

        const result = await response.json();

        if (result.success && result.valid) {
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem('admin_session_token');
          setError('세션이 만료되었습니다. 다시 로그인해주세요.');
        }
      } catch (error) {
        console.error('Session check error:', error);
        sessionStorage.removeItem('admin_session_token');
        setError('세션 확인 중 오류가 발생했습니다.');
      }
    }

    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (attempts >= 5) {
      setError('너무 많은 시도입니다. 10분 후 다시 시도하세요.');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password
        })
      });

      const result = await response.json();

      if (result.success && result.sessionToken) {
        sessionStorage.setItem('admin_session_token', result.sessionToken);
        setIsAuthenticated(true);
        setAttempts(0);
        setError('');
      } else {
        setAttempts(attempts + 1);
        setError(result.error || '로그인 실패');
        setPassword('');
      }
    } catch (error: any) {
      setAttempts(attempts + 1);
      setError('서버 오류가 발생했습니다.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_session_token');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRecoveryMessage('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/request-password-recovery`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: recoveryEmail }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setRecoveryMessage('복구 코드가 이메일로 전송되었습니다');
        setRecoveryStep('code');
      } else {
        setError(result.error);
      }
    } catch (error: any) {
      setError('서버 오류가 발생했습니다');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRecoveryMessage('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password-with-code`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recoveryCode, newPassword }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setRecoveryMessage('비밀번호가 변경되었습니다. 로그인해주세요.');
        setTimeout(() => {
          setShowRecovery(false);
          setRecoveryStep('email');
          setRecoveryCode('');
          setNewPassword('');
          setRecoveryEmail('');
        }, 2000);
      } else {
        setError(result.error);
      }
    } catch (error: any) {
      setError('서버 오류가 발생했습니다');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (showRecovery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-700">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-purple-600 p-4 rounded-full">
              <Lock className="text-white" size={40} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-white mb-2">
            비밀번호 복구
          </h1>
          <p className="text-center text-gray-400 text-sm mb-8">
            {recoveryStep === 'email'
              ? '등록된 이메일로 복구 코드를 받으세요'
              : '이메일로 받은 6자리 코드를 입력하세요'}
          </p>

          {recoveryStep === 'email' ? (
            <form onSubmit={handleRequestRecovery} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  이메일 주소
                </label>
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="admin@bustime.site"
                  required
                  autoFocus
                />
              </div>

              {recoveryMessage && (
                <div className="p-4 bg-green-900 bg-opacity-50 border border-green-700 rounded-xl">
                  <p className="text-sm text-green-200 text-center">{recoveryMessage}</p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-xl">
                  <p className="text-sm text-red-200 text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full px-4 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-bold text-lg shadow-lg"
              >
                복구 코드 받기
              </button>

              <button
                type="button"
                onClick={() => setShowRecovery(false)}
                className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
              >
                로그인으로 돌아가기
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  복구 코드 (6자리)
                </label>
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="8자 이상"
                  minLength={8}
                  required
                />
              </div>

              {recoveryMessage && (
                <div className="p-4 bg-green-900 bg-opacity-50 border border-green-700 rounded-xl">
                  <p className="text-sm text-green-200 text-center">{recoveryMessage}</p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-xl">
                  <p className="text-sm text-red-200 text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full px-4 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-bold text-lg shadow-lg"
              >
                비밀번호 변경
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecoveryStep('email');
                  setRecoveryCode('');
                  setNewPassword('');
                }}
                className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
              >
                다시 시도
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-700">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-600 p-4 rounded-full">
            <Lock className="text-white" size={40} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-white mb-2">
          관리자 로그인
        </h1>
        <p className="text-center text-gray-400 text-sm mb-8">
          전국 교통정보 플랫폼 관리 시스템
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              아이디
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="관리자 아이디"
              required
              autoFocus
              disabled={attempts >= 5}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="비밀번호"
              required
              disabled={attempts >= 5}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-xl">
              <p className="text-sm text-red-200 text-center">{error}</p>
              {attempts > 0 && attempts < 5 && (
                <p className="text-xs text-red-300 text-center mt-1">
                  남은 시도: {5 - attempts}회
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={attempts >= 5 || !username || !password}
            className="w-full px-4 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-xl transition-colors font-bold text-lg shadow-lg disabled:cursor-not-allowed"
          >
            로그인
          </button>

          <button
            type="button"
            onClick={() => setShowRecovery(true)}
            className="w-full mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            비밀번호를 잊으셨나요?
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            관리자 전용 시스템입니다
            <br />
            메인 도메인에서는 접근할 수 없습니다
          </p>
        </div>
      </div>
    </div>
  );
}
