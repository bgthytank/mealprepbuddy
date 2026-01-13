import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user is on a mobile/touch device
 * Uses multiple detection methods for reliability
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Method 1: Check for touch support
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Method 2: Check screen width (tablets and phones)
      const isSmallScreen = window.innerWidth < 1024;

      // Method 3: Check user agent (fallback)
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileUA = mobileRegex.test(navigator.userAgent);

      // Consider it mobile if it has touch AND (small screen OR mobile UA)
      setIsMobile(hasTouch && (isSmallScreen || isMobileUA));
    };

    // Check on mount
    checkIsMobile();

    // Re-check on window resize
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};
