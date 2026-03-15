'use client';

import { useState } from 'react';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
}

export default function ApiKeysSection() {
  // UI-only — no backend API key management yet
  const [keys] = useState<ApiKey[]>([]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">API Keys</h2>
        <button
          disabled
          className="text-sm px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
        >
          + Create Key
        </button>
      </div>

      {keys.length === 0 ? (
        <div className="text-center py-6">
          <svg
            className="w-10 h-10 mx-auto text-gray-200 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
            />
          </svg>
          <p className="text-sm text-gray-400">No API keys created</p>
          <p className="text-xs text-gray-300 mt-1">API key management coming soon</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{key.name}</p>
                <p className="text-xs text-gray-400 font-mono">{key.prefix}...***</p>
              </div>
              <p className="text-xs text-gray-400">{key.createdAt}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
