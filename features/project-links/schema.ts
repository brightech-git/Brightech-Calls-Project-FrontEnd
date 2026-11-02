import { z } from 'zod';
import { positiveId, optionalUrl } from '@/utils/validation';
export const projectLinkSchema = z.object({
  clientId: positiveId('Client'),
  projectTypeId: positiveId('Project type'),
  url: optionalUrl,
  userName: z.string(),
  password: z.string(),
  authPassword: z.string(),
  status: z.enum(['L', 'T']),
  type: z.enum(['D', 'M', 'W']),
  active: z.boolean(),
});
export type ProjectLinkForm = z.infer<typeof projectLinkSchema>;
export const projectLinkDefaults: ProjectLinkForm = {
  clientId: 0,
  projectTypeId: 0,
  url: '',
  userName: '',
  password: '',
  authPassword: '',
  status: 'L',
  type: 'W',
  active: true,
};
