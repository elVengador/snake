import { useEffect, useState } from "react";

type ElementSize = {
    elementWidth: number;
    elementHeight: number;
  }
  
  export const useElementSize = (elementRef: React.RefObject<HTMLElement>): ElementSize => {
    const [elementSize, setElementSize] = useState<ElementSize>({
      elementWidth: 0,
      elementHeight: 0,
    });
  
    useEffect(() => {
      const updateElementSize = () => {
        if (elementRef.current) {
          const { offsetWidth, offsetHeight } = elementRef.current;
          console.log('resizeObserver')
          setElementSize({
            elementWidth: offsetWidth,
            elementHeight: offsetHeight,
          });
        }
      };
  
      // Update size on mount
      updateElementSize();
  
      // Event listener for element size changes
      const resizeObserver = new ResizeObserver(updateElementSize);
      if (elementRef.current) {
        resizeObserver.observe(elementRef.current);
      }
  
      // Cleanup the event listener on component unmount
      return () => {
        if (elementRef.current) {
          resizeObserver.unobserve(elementRef.current);
        }
      };
    }, [elementRef]);
  
    return elementSize;
  };