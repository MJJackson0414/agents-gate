'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { verifyAdminPassword, setAdminToken } from '@/lib/adminApi';

interface AdminPasswordModalProps {
  onClose: () => void;
}

export default function AdminPasswordModal({ onClose }: AdminPasswordModalProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('請輸入密碼');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await verifyAdminPassword(password);
      if (res.success && res.data) {
        setAdminToken(res.data.token);
        onClose();
        router.push('/admin/reviews');
      } else {
        setError('密碼錯誤');
      }
    } catch {
      setError('連線失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal card */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-bold text-gray-900 mb-1">案件審查</h2>
        <p className="text-sm text-gray-500 mb-5">請輸入管理員密碼以進入審核後台</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="管理員密碼"
            autoFocus
            className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />

          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full px-6 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '驗證中...' : '進入審核後台'}
          </button>
        </form>
      </div>
    </div>
  );
}
