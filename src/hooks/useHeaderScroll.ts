import { useState, useEffect } from 'react';

/**
 * Custom hook to track scroll direction and auto-hide top navigation ribbon on scroll down,
 * and reveal it on scroll up or when at the top of the page.
 * Uses requestAnimationFrame throttling and passive event listeners for high performance.
 */
export function useHeaderScroll(threshold = 10) {
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDir = () => {
      const currentScrollY = window.scrollY;

      // Always keep ribbon visible at top of page
      if (currentScrollY <= threshold) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 5) {
        // Scrolling DOWN past threshold -> hide ribbon
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY && lastScrollY - currentScrollY > 5) {
        // Scrolling UP -> reveal ribbon
        setShowHeader(true);
      }

      lastScrollY = Math.max(0, currentScrollY);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [threshold]);

  return showHeader;
}
