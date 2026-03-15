'use client';

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

interface ProjectCardProps {
  project: Project;
  hotelSlug: string;
  isEditing: boolean;
  editName: string;
  onStartEdit: () => void;
  onEditNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export default function ProjectCard({
  project, hotelSlug, isEditing, editName,
  onStartEdit, onEditNameChange, onSaveEdit, onCancelEdit,
}: ProjectCardProps) {
  const theme = THEMES.find((t) => t.id === project.theme);
  const doneGenerations = project.vas_generations?.filter((g) => g.status === 'done') || [];
  const totalCount = project.vas_generations?.length || 0;
  const errorCount = project.vas_generations?.filter((g) => g.status === 'error').length || 0;
  const previewPairs = doneGenerations.slice(0, 4);

  return (
    <Link
      href={`/ai-studio/${hotelSlug}/projects/${project.id}`}
      className="block bg-luxury-card rounded-xl overflow-hidden border border-gold/10 card-hover"
    >
      <div className="flex flex-col md:flex-row">
        <div className="md:w-2/3 p-4">
          {previewPairs.length > 0 ? (
            <div className={`grid gap-3 ${previewPairs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {previewPairs.map((gen) => (
                <div key={gen.id} className="grid grid-cols-2 gap-0.5 rounded-lg overflow-hidden">
                  <div className="aspect-video bg-luxury-black relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={gen.vas_photos?.original_url} alt="Original" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[9px] font-medium bg-black/60 text-cream px-1 py-0.5 rounded">Before</span>
                  </div>
                  <div className="aspect-video bg-luxury-black relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={gen.result_url || ''} alt="Generated" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[9px] font-medium bg-gold text-luxury-black px-1 py-0.5 rounded">After</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-video bg-luxury-black/50 rounded-lg flex items-center justify-center">
              <div className="text-center text-cream-dark/30">
                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <p className="text-xs mt-1">{project.status === 'pending' ? 'Processing...' : 'No results'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="md:w-1/3 p-4 md:border-l border-t md:border-t-0 border-luxury-border flex flex-col justify-between">
          <div>
            {isEditing ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => onEditNameChange(e.target.value)}
                onBlur={onSaveEdit}
                onKeyDown={(e) => { if (e.key === 'Enter') onSaveEdit(); if (e.key === 'Escape') onCancelEdit(); }}
                onClick={(e) => e.preventDefault()}
                className="w-full text-base font-semibold border-b border-gold outline-none pb-0.5 bg-transparent text-cream"
              />
            ) : (
              <h3
                className="text-base font-display font-semibold text-cream line-clamp-2 hover:text-gold transition-colors"
                onDoubleClick={(e) => { e.preventDefault(); onStartEdit(); }}
                title="Double-click to rename"
              >
                {project.name}
              </h3>
            )}

            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {theme && (
                <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full border border-gold/20">
                  {theme.emoji} {theme.name}
                </span>
              )}
              {project.vas_people && (
                <span className="text-xs bg-luxury-hover text-cream-muted px-2 py-0.5 rounded-full flex items-center gap-1 border border-luxury-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={project.vas_people.image_url} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                  {project.vas_people.name}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-luxury-border">
            <div className="flex items-center justify-between text-xs text-cream-dark">
              <span>{new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span>
                {doneGenerations.length}/{totalCount} photos
                {errorCount > 0 && <span className="text-red-400 ml-1">({errorCount} failed)</span>}
              </span>
            </div>
            {project.status === 'pending' && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-gold">
                <div className="animate-spin h-3 w-3 border-2 border-gold border-t-transparent rounded-full" />
                Processing...
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
