import type {
  Dog,
  DogProfileInput,
  IntakeResponse,
  SubmitIntakeInput,
  UpdateDogInput,
} from '@ccc/shared';
import { api } from './api';

/** Thin wrappers around the @ccc/shared ApiClient for the dogs endpoints. */
export const dogs = {
  list: () => api.get<{ dogs: Dog[] }>('/dogs').then((r) => r.dogs),
  get: (id: string) => api.get<{ dog: Dog }>(`/dogs/${id}`).then((r) => r.dog),
  create: (input: DogProfileInput) => api.post<{ dog: Dog }>('/dogs', input).then((r) => r.dog),
  update: (id: string, patch: UpdateDogInput) =>
    api
      .request<{ dog: Dog }>(`/dogs/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
      .then((r) => r.dog),
  archive: (id: string) =>
    api.request<unknown>(`/dogs/${id}`, { method: 'DELETE' }).then(() => undefined),
  getIntake: (id: string) =>
    api.get<{ intake: IntakeResponse }>(`/dogs/${id}/intake`).then((r) => r.intake),
  submitIntake: (id: string, input: SubmitIntakeInput) =>
    api
      .request<{ intake: IntakeResponse; dog: Dog }>(`/dogs/${id}/intake`, {
        method: 'PUT',
        body: JSON.stringify(input),
      })
      .then((r) => r),
};
