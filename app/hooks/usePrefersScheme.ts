import { useEffect, useState } from 'react';

type Scheme = 'light' | 'dark';

function usePrefersScheme(): Scheme {
  // Check for the client-side `window` object to support server-side rendering
  const isClient = typeof window !== 'undefined';

  // Get the initial system theme preference or default to 'light'
  const getInitialScheme = () => 
    isClient && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

  const [scheme, setScheme] = useState<Scheme>(getInitialScheme);

  useEffect(() => {
    if (!isClient) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setScheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [isClient]);

  return scheme;
}

export default usePrefersScheme;