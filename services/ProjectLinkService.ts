// Compatibility export for existing consumers. New feature code lives together.
export {
  listProjectLinks as getAllProjectLinks,
  getProjectLink as getProjectLinkById,
  createProjectLink,
  updateProjectLink,
  deleteProjectLink,
} from '@/features/project-links/service';
