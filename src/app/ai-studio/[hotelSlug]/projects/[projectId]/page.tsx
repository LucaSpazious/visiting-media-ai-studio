'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { THEMES } from '@/lib/themes';
import GenerationCard from './GenerationCard';

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
        if (res.ok) setProject(await res.json());
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') fetchProject();
  }, [status, projectId]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxury-black">
        <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxury-black">
        <p className="text-cream-dark">Project not found</p>
      </div>
    );
  }

  const theme = THEMES.find((t) => t.id === project.theme);
  const doneCount = project.vas_generations?.filter((g) => g.status === 'done').length || 0;
  const totalCount = project.vas_generations?.length || 0;

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
    <div className="min-h-screen bg-luxury-black">
      <nav className="bg-gradient-to-r from-luxury-surface via-luxury-card to-luxury-surface border-b border-gold/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href={`/ai-studio/${hotelSlug}/projects`} className="text-cream-dark hover:text-cream transition-colors">
                &larr; Projects
              </Link>
              <h1 className="text-xl font-display font-bold text-cream truncate max-w-md">{project.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              {theme && (
                <span className="text-sm bg-gold/10 text-gold px-3 py-1 rounded-full border border-gold/20">
                  {theme.emoji} {theme.name}
                </span>
              )}
              {project.vas_people && (
                <span className="text-sm bg-luxury-hover text-cream-muted px-3 py-1 rounded-full flex items-center gap-1.5 border border-luxury-border">
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 text-sm text-cream-dark">
            <span>{doneCount}/{totalCount} photos generated</span>
            <span>{new Date(project.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="bg-luxury-card rounded-xl p-12 text-center border border-luxury-border">
            <p className="text-cream-muted">No generated photos yet</p>
            {project.status === 'pending' && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gold">
                <div className="animate-spin h-4 w-4 border-2 border-gold border-t-transparent rounded-full" />
                Generation in progress...
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([typeName, spaces]) => (
              <div key={typeName}>
                <h2 className="text-lg font-display font-semibold text-cream mb-5">{typeName}</h2>
                <div className="space-y-8">
                  {Object.entries(spaces).map(([spaceName, generations]) => (
                    <div key={spaceName}>
                      <h3 className="text-sm font-medium text-cream-muted mb-3 ml-1">{spaceName}</h3>
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

