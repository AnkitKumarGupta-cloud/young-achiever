export type Role = 'admin' | 'parent';

export type Me = { id: string; username: string; role: Role };

export type Achiever = {
  id: string;
  owner_id: string;
  slug: string;
  full_name: string;
  bio: string;
  fide_id: string | null;
  fide_standard: number | null;
  fide_rapid: number | null;
  fide_blitz: number | null;
  fide_synced_at?: string | null;
  fide_history?: { p: string; s: number | null; r: number | null; b: number | null }[] | null;
  hero_x?: number | null;
  hero_y?: number | null;
  published: boolean;
  taken_down: boolean;
};

export type OtherRating = { id: string; label: string; value: string };
export type TournamentResult = { id: string; year: number; event: string; result: string };
export type PhotoItem = { id: string; url: string; caption: string | null };

export type LoadedProfile = {
  achiever: Achiever;
  other: OtherRating[];
  results: TournamentResult[];
  photos: PhotoItem[];
  certificates: PhotoItem[];
};

export type FormState = { error?: string; ok?: string } | undefined;

/** What we read off a certificate, for the parent to review. */
export type CertGuess = { year: string; event: string; result: string; title: string; warning?: string };
