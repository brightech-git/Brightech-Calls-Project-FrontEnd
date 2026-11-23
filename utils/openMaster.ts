/**
 * "Add new" handler for a combobox: opens the master screen in a new tab, so the
 * form being filled keeps its values. When the user comes back to this tab, React
 * Query refetches the list (refetchOnWindowFocus), so the new entry shows up.
 */
export const openMaster = (path: string) => () => {
  window.open(path, "_blank", "noopener");
};
