import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    const media = window.matchMedia(query)
    const updateMatch = () => {
      setMatches(media.matches)
    }
    
    // Set initial value
    updateMatch()
    
    // Setup listeners for changes
    // Modern browsers
    media.addEventListener('change', updateMatch)
    return () => media.removeEventListener('change', updateMatch)
  }, [query])

  return matches
}

export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
}
