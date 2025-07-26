import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';

interface PageConfig {
  path: string;
  component: React.ComponentType;
  name: string;
}

export const useInfiniteScroll = (pages: PageConfig[]) => {
  const [location, setLocation] = useLocation();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | 'up' | 'down'>('right');
  const [isScrolling, setIsScrolling] = useState(false);

  // Find current page index based on location
  useEffect(() => {
    const pageIndex = pages.findIndex(page => page.path === location);
    if (pageIndex !== -1) {
      setCurrentPageIndex(pageIndex);
    }
  }, [location, pages]);

  const navigateToPage = useCallback((newIndex: number, newDirection: 'left' | 'right' | 'up' | 'down' = 'right') => {
    if (newIndex >= 0 && newIndex < pages.length && !isScrolling) {
      setIsScrolling(true);
      setDirection(newDirection);
      setLocation(pages[newIndex].path);
      
      // Reset scrolling state after animation
      setTimeout(() => {
        setIsScrolling(false);
      }, 500);
    }
  }, [pages, isScrolling, setLocation]);

  const nextPage = useCallback(() => {
    const nextIndex = (currentPageIndex + 1) % pages.length;
    navigateToPage(nextIndex, 'left');
  }, [currentPageIndex, pages.length, navigateToPage]);

  const prevPage = useCallback(() => {
    const prevIndex = currentPageIndex === 0 ? pages.length - 1 : currentPageIndex - 1;
    navigateToPage(prevIndex, 'right');
  }, [currentPageIndex, pages.length, navigateToPage]);

  const goToPage = useCallback((index: number) => {
    const newDirection = index > currentPageIndex ? 'left' : 'right';
    navigateToPage(index, newDirection);
  }, [currentPageIndex, navigateToPage]);

  // Touch/swipe handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > 50;
    const isRightSwipe = distanceX < -50;
    const isUpSwipe = distanceY > 50;
    const isDownSwipe = distanceY < -50;

    // Horizontal swipes for page navigation
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe) {
        nextPage();
      } else if (isRightSwipe) {
        prevPage();
      }
    }
  }, [touchStart, touchEnd, nextPage, prevPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isScrolling) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevPage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextPage();
          break;
        case 'ArrowUp':
          e.preventDefault();
          // Could be used for vertical navigation in the future
          break;
        case 'ArrowDown':
          e.preventDefault();
          // Could be used for vertical navigation in the future
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, isScrolling]);

  // Touch event listeners
  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    currentPageIndex,
    direction,
    isScrolling,
    nextPage,
    prevPage,
    goToPage,
    navigateToPage,
    pages
  };
};