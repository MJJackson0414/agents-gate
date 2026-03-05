'use client';

import { useState } from 'react';
import Link from 'next/link';
import AdminPasswordModal from '@/components/AdminPasswordModal';

export default function HomeHeader() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">AgentsGate</h1>
            <p className="text-xs text-gray-400">上傳一次，適配所有 CLI</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              案件審查
            </button>
            <Link
              href="/upload"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + 上傳 Skill / Agent
            </Link>
          </div>
        </div>
      </header>

      {showModal && <AdminPasswordModal onClose={() => setShowModal(false)} />}
    </>
  );
}
