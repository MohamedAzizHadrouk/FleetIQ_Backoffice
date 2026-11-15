import { useEffect, useState } from 'react';

export const PAGE_SIZES = [5, 10, 25, 50];

/** Pagination : 5 / 10 / 25 / 50 par page, « 1–10 sur 450 », ‹ › */
export function usePager<T>(items: T[], initial = 10) {
  const [size, setSize] = useState(initial);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / size));
  useEffect(() => {
    if (page > pages - 1) setPage(0);
  }, [page, pages]);
  const p = Math.min(page, pages - 1);
  return {
    size,
    page: p,
    pages,
    slice: items.slice(p * size, p * size + size),
    setSize: (n: number) => {
      setSize(n);
      setPage(0);
    },
    setPage,
    total: items.length
  };
}

