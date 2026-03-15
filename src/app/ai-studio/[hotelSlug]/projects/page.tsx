'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { THEMES } from '@/lib/themes';

interface Generation {
  id: string;
  result_url: string | null;
  status: string;
  prompt: string;
  vas_photos: {
    id: string;
    filename: string;
    original_url: string;
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
            <p className="text-gray-500 text-sm mt-1">
              {projects.length} generation{projects.length !== 1 ? 's' : ''} completed
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <p className="text-gray-500">No projects yet</p>
            <p className="text-gray-400 text-sm mt-1">Projects are created when you generate themed photos in the Generate tab</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                hotelSlug={hotelSlug}
                isEditing={editingId === project.id}
                editName={editName}
                onStartEdit={() => { setEditingId(project.id); setEditName(project.name); }}
                onEditNameChange={setEditName}
                onSaveEdit={() => handleRename(project.id)}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ProjectCard({
  project,
  hotelSlug,
  isEditing,
  editName,
  onStartEdit,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
}: {
  project: Project;
  hotelSlug: string;
  isEditing: boolean;
  editName: string;
  onStartEdit: () => void;
  onEditNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}) {
  const theme = THEMES.find((t) => t.id === project.theme);
  const doneGenerations = project.vas_generations?.filter((g) => g.status === 'done') || [];
  const totalCount = project.vas_generations?.length || 0;
  const errorCount = project.vas_generations?.filter((g) => g.status === 'error').length || 0;

  // Get up to 4 before/after pairs for preview
  const previewPairs = doneGenerations.slice(0, 4);

  return (
    <Link
      href={`/ai-studio/${hotelSlug}/projects/${project.id}`}
      className="block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col md:flex-row">
        {/* Before/After preview thumbnails */}
        <div className="md:w-2/3 p-4">
          {previewPairs.length > 0 ? (
            <div className={`grid gap-3 ${previewPairs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {previewPairs.map((gen) => (
                <div key={gen.id} className="grid grid-cols-2 gap-0.5 rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gray-100 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gen.vas_photos?.original_url}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 text-[9px] font-medium bg-black/50 text-white px-1 py-0.5 rounded">
                      Before
                    </span>
                  </div>
                  <div className="aspect-video bg-gray-100 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gen.result_url || ''}
                      alt="Generated"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 text-[9px] font-medium bg-indigo-600 text-white px-1 py-0.5 rounded">
                      After
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-300">
                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <p className="text-xs mt-1">
                  {project.status === 'pending' ? 'Processing...' : 'No results'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Project info */}
        <div className="md:w-1/3 p-4 md:border-l border-t md:border-t-0 border-gray-100 flex flex-col justify-between">
          <div>
            {isEditing ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => onEditNameChange(e.target.value)}
                onBlur={onSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit();
                  if (e.key === 'Escape') onCancelEdit();
                }}
                onClick={(e) => e.preventDefault()}
                className="w-full text-base font-semibold border-b border-blue-500 outline-none pb-0.5"
              />
            ) : (
              <h3
                className="text-base font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors"
                onDoubleClick={(e) => { e.preventDefault(); onStartEdit(); }}
                title="Double-click to rename"
              >
                {project.name}
              </h3>
            )}

            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {theme && (
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                  {theme.emoji} {theme.name}
                </span>
              )}
              {project.vas_people && (
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={project.vas_people.image_url} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                  {project.vas_people.name}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span>
                {doneGenerations.length}/{totalCount} photos
                {errorCount > 0 && (
                  <span className="text-red-500 ml-1">({errorCount} failed)</span>
                )}
              </span>
            </div>
            {project.status === 'pending' && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                <div className="animate-spin h-3 w-3 border-2 border-amber-600 border-t-transparent rounded-full" />
                Processing...
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
