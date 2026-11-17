export function mount(root: HTMLElement, opts?: {
  view?: string;
  role?: string;
  search?: string;
  navigate?: (href: string) => void;
  after?: (api: { setView: ((v: string) => void) | null }) => void;
}): () => void;
