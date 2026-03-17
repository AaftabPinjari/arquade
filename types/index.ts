export interface Page {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  icon: string;
  cover_url: string | null;
  content: unknown;
  sort_order: string;
  is_archived: boolean;
  is_favorite: boolean;
  is_published: boolean;
  full_width: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

// React-Arborist tree data shape
export interface TreePage {
  id: string;
  name: string;
  icon: string;
  isFavorite: boolean;
  isArchived: boolean;
  sortOrder: string;
  children?: TreePage[];
}
