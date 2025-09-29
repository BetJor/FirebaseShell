
"use client"

import { useEffect, useState } from 'react'

// Default to Tailwind's md breakpoint
export function useIsMobile(query: string = '(max-width: 768px)') {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    
    // Ensure window.matchMedia is supported
    if (typeof mediaQuery.addEventListener === 'function') {
        const handleResize = () => setIsMobile(mediaQuery.matches)
        
        // Set initial state
        handleResize()
        
        mediaQuery.addEventListener('change', handleResize)

        return () => {
            mediaQuery.removeEventListener('change', handleResize)
        }
    } else {
        // Fallback for older browsers
        let isMobileLegacy = mediaQuery.matches;
        setIsMobile(isMobileLegacy);
    }
  }, [query])

  return isMobile
}
