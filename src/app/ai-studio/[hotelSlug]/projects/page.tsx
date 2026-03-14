'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { THEMES } from '@/lib/themes';

interface Generation {
  id: string;
  result_url: string;
  status: string;
  vas_photos: {
    filename: string;
    space_id: string;
    vas_spaces: {
      name: string;
      vas_space_types: { name: string };
    };
  };
}

interface Project {
  id: string;
  name: string;
  theme: string;
  status: string;
  created_at: string;
  vas_people: { name: string; image_url: string } | null;
  vas_generations: Generation[];
}

export default function ProjectsPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const hotelSlug = params.hotelSlug as string;

  const [projects, setProjects] = useState<Project[]>([]);
  const [, setHotelId] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const hotelRes = await fetch(`/api/hotels/${hotelSlug}`);
        if (!hotelRes.ok) return;
        const hotel = await hotelRes.json();
        setHotelId(hotel.id);
        setHotelName(hotel.name);

        const projRes = await fetch(`/api/projects?hotelId=${hotel.id}`);
        if (projRes.ok) {
          setProjects(await projRes.json());
        }
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') fetchData();
  }, [status, hotelSlug]);

  async function handleRename(projectId: string) {
    if (!editName.trim()) return;
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    });
    if (res.ok) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, name: editName } : p))
      );
    }
    setEditingId(null);
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href={`/ai-studio/${hotelSlug}`} className="text-gray-500 hover:text-gray-900">
                &larr; AI Studio
              </Link>
              <h1 className="text-xl font-bold text-gray-900">{hotelName}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/ai-studio/${hotelSlug}`} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2">Photos</Link>
              <span className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">Projects</span>
              <Link href={`/ai-studio/${hotelSlug}/people`} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2">People Bank</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-500 text-sm mt-1">Generated photo collections</p>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500">No projects yet</p>
            <p className="text-gray-400 text-sm mt-1">Projects are created when you generate themed photos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const theme = THEMES.find((t) => t.id === project.theme);
              const coverUrl = project.vas_generations?.find((g) => g.result_url)?.result_url;
              const doneCount = project.vas_generations?.filter((g) => g.status === 'done').length || 0;
              const totalCount = project.vas_generations?.length || 0;

              return (
                <Link
                  key={project.id}
                  href={`/ai-studio/${hotelSlug}/projects/${project.id}`}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 group hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video relative bg-gray-100">
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coverUrl} alt={project.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    {editingId === project.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleRename(project.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRename(project.id); if (e.key === 'Escape') setEditingId(null); }}
                        onClick={(e) => e.preventDefault()}
                        className="w-full text-sm font-semibold border-b border-blue-500 outline-none pb-0.5"
                      />
                    ) : (
                      <h3
                        className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors cursor-pointer"
                        onDoubleClick={(e) => { e.preventDefault(); setEditingId(project.id); setEditName(project.name); }}
                        title="Double-click to rename"
                      >
                        {project.name}
                      </h3>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {theme && (
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                          {theme.emoji} {theme.name}
                        </span>
                      )}
                      {project.vas_people && (
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                          {project.vas_people.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-400">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {doneCount}/{totalCount} photos
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
