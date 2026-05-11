import type { BreedProfile, BreedProfileSummary } from '@ccc/shared';
import { api } from './api';

export const breeds = {
  list: (search?: string) =>
    api
      .get<{
        breeds: BreedProfileSummary[];
      }>(search ? `/breeds?search=${encodeURIComponent(search)}` : '/breeds')
      .then((r) => r.breeds),
  get: (slug: string) => api.get<{ breed: BreedProfile }>(`/breeds/${slug}`).then((r) => r.breed),
};

/** Best-effort: convert a free-text breed name to the seeded slug we use. */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/×/g, 'x')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
