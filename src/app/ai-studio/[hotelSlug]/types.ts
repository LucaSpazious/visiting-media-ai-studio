export interface Space {
  id: string;
  name: string;
}

export interface SpaceType {
  id: string;
  name: string;
  vas_spaces: Space[];
}

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  space_types: SpaceType[];
}

export interface Photo {
  id: string;
  original_url: string;
  filename: string;
  space_id: string;
  space_type_id: string;
}

export interface Person {
  id: string;
  name: string;
  image_url: string;
}

export type ScopeLevel = 'hotel' | 'type' | 'space';
export type ActiveTab = 'photos' | 'generate';

export interface GenerationResult {
  photoId: string;
  originalUrl: string;
  filename: string;
  status: 'pending' | 'generating' | 'done' | 'error';
  resultUrl?: string;
  prompt?: string;
  error?: string;
}
