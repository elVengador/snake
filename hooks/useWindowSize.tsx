import { useEffect, useState } from "react";

type WindowSize = {
    windowWidth: number;
    windowHeight: number;
  }

export const useWindowSize = (): WindowSize => {
    const [windowSize, setWindowSize] = useState<WindowSize>({
      windowWidth: 0,
      windowHeight: 0,
    });
  
    useEffect(() => {
      const handleResize = () => {
        setWindowSize({
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
        });
      };
  
      // Initial size on mount
      handleResize();
  
      window.addEventListener('resize', handleResize);
  
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    return windowSize;
  };