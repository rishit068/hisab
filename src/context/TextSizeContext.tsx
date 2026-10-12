import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type TextSize = 'normal' | 'large' | 'extra-large';

interface TextSizeContextValue {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
}

const STORAGE_KEY = 'hisaab-text-size';
const TextSizeContext = createContext<TextSizeContextValue | null>(null);

export function TextSizeProvider({ children }: { children: ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as TextSize | null;
    return saved === 'large' || saved === 'extra-large' ? saved : 'normal';
  });

  const applyTextSize = (size: TextSize) => {
    const root = document.documentElement;
    root.classList.remove('text-large', 'text-extra-large');
    if (size === 'large') {
      root.classList.add('text-large');
    } else if (size === 'extra-large') {
      root.classList.add('text-extra-large');
    }
  };

  useEffect(() => {
    applyTextSize(textSize);
  }, [textSize]);

  const setTextSize = (size: TextSize) => {
    localStorage.setItem(STORAGE_KEY, size);
    setTextSizeState(size);
    applyTextSize(size);
  };

  return (
    <TextSizeContext.Provider value={{ textSize, setTextSize }}>
      {children}
    </TextSizeContext.Provider>
  );
}

export function useTextSize() {
  const context = useContext(TextSizeContext);
  if (!context) {
    throw new Error('useTextSize must be used within a TextSizeProvider');
  }
  return context;
}
