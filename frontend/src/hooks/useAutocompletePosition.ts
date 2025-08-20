import { useEffect, useState, RefObject } from 'react';

interface UseAutocompletePositionProps {
  isOpen: boolean;
  inputRef: RefObject<HTMLInputElement>;
  dropdownRef: RefObject<HTMLDivElement>;
}

export function useAutocompletePosition({
  isOpen,
  inputRef,
  dropdownRef
}: UseAutocompletePositionProps) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!isOpen || !inputRef.current || !dropdownRef.current) return;

    const updatePosition = () => {
      if (!inputRef.current) return;

      const inputRect = inputRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - inputRect.bottom;
      const dropdownHeight = dropdownRef.current?.offsetHeight || 300;

      // Determine if dropdown should appear above or below
      const shouldShowAbove = spaceBelow < dropdownHeight && inputRect.top > dropdownHeight;

      setPosition({
        top: shouldShowAbove 
          ? inputRect.top - dropdownHeight - 8 
          : inputRect.bottom + 8,
        left: inputRect.left,
        width: inputRect.width
      });
    };

    updatePosition();

    // Update position on scroll or resize
    const handleUpdate = () => requestAnimationFrame(updatePosition);
    window.addEventListener('scroll', handleUpdate, { passive: true });
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen, inputRef, dropdownRef]);

  return position;
}