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
  result_url: string;
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
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              {theme && (
                <span className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                  {theme.emoji} {theme.name}
                </span>
              )}
              {project.vas_people && (
                <span className="text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                  {project.vas_people.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500">No generated photos yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([typeName, spaces]) => (
              <div key={typeName}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{typeName}</h2>
                <div className="space-y-6">
                  {Object.entries(spaces).map(([spaceName, generations]) => (
                    <div key={spaceName}>
                      <h3 className="text-sm font-medium text-gray-600 mb-3 ml-1">{spaceName}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {generations.map((gen) => (
                          <div key={gen.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                            <div className="aspect-video relative bg-gray-100">
                              {gen.result_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={gen.result_url} alt={gen.vas_photos?.filename || 'Generated'} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                                  {gen.status === 'processing' ? 'Processing...' : gen.status}
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="text-xs text-gray-500 truncate">{gen.vas_photos?.filename}</p>
                              {gen.result_url && (
                                <a
                                  href={gen.result_url}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                                >
                                  Download
                                </a>
                              )}
                            </div>
                          </div>
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
