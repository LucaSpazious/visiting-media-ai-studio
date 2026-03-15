'use client';

import { useState } from 'react';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  hotel_id: string | null;
  created_at: string;
}

interface ProfileSectionProps {
  user: UserData | null;
  onUpdate: (user: UserData) => void;
}

export default function ProfileSection({ user, onUpdate }: ProfileSectionProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.ok) {
        if (user) onUpdate({ ...user, name: name.trim() });
        setEditing(false);
        setMessage('Profile updated');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to update');
      }
    } catch {
      setMessage('Failed to update');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="font-semibold text-gray-900 mb-4">Profile</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
          <p className="text-gray-900">{user?.email || '—'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') { setEditing(false); setName(user?.name || ''); }
                }}
                className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => { setEditing(false); setName(user?.name || ''); }}
                className="text-sm px-3 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-gray-900">{user?.name || '—'}</p>
              <button
                onClick={() => { setEditing(true); setName(user?.name || ''); }}
                className="text-xs text-blue-600 hover:underline"
              >
                Edit
              </button>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
          <p className="text-gray-900 capitalize">{user?.role?.replace('_', ' ') || '—'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Member since</label>
          <p className="text-gray-900">
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
              : '—'}
          </p>
        </div>
        {message && (
          <p className={`text-sm ${message.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
