'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { THEMES } from '@/lib/themes';

interface PhotoInfo {
  id: string;
  filename: string;
  original_url: string;
  space_id: string;
  vas_spaces: {
    name: string;
    space_type_id: string;
    vas_space_types: { name: string };
  };
}

interface Generation {
  id: string;
  result_url: string | null;
  status: string;
  prompt: string;
  vas_photos: PhotoInfo;
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

interface GroupedByType {
  [typeName: string]: {
    [spaceName: string]: Generation[];
  };
}

export default function ProjectDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const hotelSlug = params.hotelSlug as string;
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (res.ok) {
          setProject(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') fetchProject();
  }, [status, projectId]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  const theme = THEMES.find((t) => t.id === project.theme);
  const doneCount = project.vas_generations?.filter((g) => g.status === 'done').length || 0;
  const totalCount = project.vas_generations?.length || 0;

  // Group generations by space type > space
  const grouped: GroupedByType = {};
  for (const gen of project.vas_generations || []) {
    if (!gen.vas_photos?.vas_spaces) continue;
    const typeName = gen.vas_photos.vas_spaces.vas_space_types?.name || 'Other';
    const spaceName = gen.vas_photos.vas_spaces.name || 'Unknown';
    if (!grouped[typeName]) grouped[typeName] = {};
    if (!grouped[typeName][spaceName]) grouped[typeName][spaceName] = [];
    grouped[typeName][spaceName].push(gen);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href={`/ai-studio/${hotelSlug}/projects`} className="text-gray-500 hover:text-gray-900">
                &larr; Projects
              </Link>
              <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">{project.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              {theme && (
                <span className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                  {theme.emoji} {theme.name}
                </span>
              )}
              {project.vas_people && (
                <span className="text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-full flex items-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={project.vas_people.image_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                  {project.vas_people.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{doneCount}/{totalCount} photos generated</span>
            <span>{new Date(project.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500">No generated photos yet</p>
            {project.status === 'pending' && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-amber-600">
                <div className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full" />
                Generation in progress...
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([typeName, spaces]) => (
              <div key={typeName}>
                <h2 className="text-lg font-semibold text-gray-900 mb-5">{typeName}</h2>
                <div className="space-y-8">
                  {Object.entries(spaces).map(([spaceName, generations]) => (
                    <div key={spaceName}>
                      <h3 className="text-sm font-medium text-gray-600 mb-3 ml-1">{spaceName}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {generations.map((gen) => (
                          <GenerationCard key={gen.id} generation={gen} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function GenerationCard({ generation }: { generation: Generation }) {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      {/* Before / After */}
      <div className="grid grid-cols-2">
        <div className="relative">
          <div className="aspect-video bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={generation.vas_photos?.original_url}
              alt={generation.vas_photos?.filename || 'Original'}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium bg-black/50 text-white px-1.5 py-0.5 rounded">
            Original
          </span>
        </div>
        <div className="relative">
          <div className="aspect-video bg-gray-100">
            {generation.status === 'done' && generation.result_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generation.result_url}
                  alt={`Generated ${generation.vas_photos?.filename}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium bg-indigo-600 text-white px-1.5 py-0.5 rounded">
                  AI Generated
                </span>
              </>
            ) : generation.status === 'processing' ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                <p className="text-xs text-gray-400 mt-2">Processing...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-xs text-red-500 mt-1">Failed</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-50">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 truncate max-w-[50%]">
            {generation.vas_photos?.filename}
          </p>
          <div className="flex items-center gap-3">
            {generation.prompt && (
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {showPrompt ? 'Hide prompt' : 'Show prompt'}
              </button>
            )}
            {generation.status === 'done' && generation.result_url && (
              <a
                href={generation.result_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download
              </a>
            )}
          </div>
        </div>
        {showPrompt && generation.prompt && (
          <p className="text-xs text-gray-400 mt-2 leading-relaxed italic">
            &ldquo;{generation.prompt}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
