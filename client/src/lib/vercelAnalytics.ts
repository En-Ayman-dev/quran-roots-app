// Dynamically load Vercel Analytics script if `VITE_VERCEL_ANALYTICS_SRC` is provided.
// Usage: set VITE_VERCEL_ANALYTICS_SRC in Vite environment (e.g., .env or Vercel env vars)

const src = import.meta.env.VITE_VERCEL_ANALYTICS_SRC as string | undefined;

if (typeof document !== 'undefined' && src) {
  try {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (!existing) {
      const s = document.createElement('script');
      s.src = src;
      s.defer = true;
      s.setAttribute('data-source', 'vercel-analytics');
      document.head.appendChild(s);
      s.addEventListener('error', () => console.warn('Vercel Analytics failed to load:', src));
    }
  } catch (e) {
    // silently fail in environments without DOM
  }
}

export {};
