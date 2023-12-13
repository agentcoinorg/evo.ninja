import {theme} from 'tailwindcss/defaultConfig';
import { useEffect, useState } from 'react';
import { sidebarAtom } from '../store';
import { useAtom } from 'jotai';

const useWindowSize = () => {
  const [sidebarOpen] = useAtom(sidebarAtom)
  const [isMobile, setIsMobile] = useState<boolean>(!sidebarOpen);
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const newWindowWidth = window?.innerWidth;
      setWindowWidth(newWindowWidth);
      const breakpoints = theme?.screens as Record<string, string>

      // Find the current breakpoint
      let current: string | null = null;
      for (const breakpoint in breakpoints) {
        const breakpointVal: number = parseInt(breakpoints[breakpoint])
        if (windowWidth <= breakpointVal) {
          current = breakpoint;
          break;
        }
      }

      setCurrentBreakpoint(current);
      setIsMobile(current === "sm" || current === "md")
    };

    window.addEventListener('resize', handleResize);

    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [windowWidth]);

  return {
    width: windowWidth,
    currentBreakpoint: currentBreakpoint,
    isMobile: isMobile,
    isDesktop: !isMobile
  };
};

export default useWindowSize