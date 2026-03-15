'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProjectCard from './ProjectCard';

interface Project {
  id: string;
  name: string;
  theme: string;
  status: string;
  created_at: string;
  vas_people: { name: string; image_url: string } | null;
  vas_generations: {
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
  }[];
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
      <div className="min-h-screen flex items-center justify-center bg-luxury-black">
        <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black">
      <nav className="bg-gradient-to-r from-luxury-surface via-luxury-card to-luxury-surface border-b border-gold/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href={`/ai-studio/${hotelSlug}`} className="text-cream-dark hover:text-cream transition-colors">
                &larr; AI Studio
              </Link>
              <h1 className="text-xl font-display font-bold text-cream">{hotelName}</h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto">
              <Link href={`/ai-studio/${hotelSlug}`} className="text-sm text-cream-dark hover:text-cream px-3 py-2 whitespace-nowrap">Photos</Link>
              <span className="text-sm font-medium text-gold bg-gold/10 px-3 py-2 rounded-lg whitespace-nowrap">Projects</span>
              <Link href={`/ai-studio/${hotelSlug}/people`} className="text-sm text-cream-dark hover:text-cream px-3 py-2 whitespace-nowrap hidden sm:block">People Bank</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-display font-bold text-cream">Projects</h2>
          <p className="text-cream-dark text-sm mt-1">
            {projects.length} generation{projects.length !== 1 ? 's' : ''} completed
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="bg-luxury-card rounded-xl p-12 text-center border border-luxury-border">
            <svg className="w-16 h-16 mx-auto text-cream-dark/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <p className="text-cream-muted">No projects yet</p>
            <p className="text-cream-dark text-sm mt-1">Projects are created when you generate themed photos</p>
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

