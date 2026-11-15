import React, { createContext, useContext, useState, useMemo } from 'react';

interface FiscalYearContextType {
  currentCalendarYear: number;
  activeYear: number;
  setActiveYear: (year: number) => void;
  availableYears: number[];
  addCustomYear: (year: number) => void;
}

const FiscalYearContext = createContext<FiscalYearContextType | undefined>(undefined);

const ACTIVE_YEAR_KEY = 'spi_smart_active_year';
const CUSTOM_YEARS_KEY = 'spi_smart_custom_years';

export const FiscalYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentCalendarYear = new Date().getFullYear();

  const [activeYear, setActiveYearState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_YEAR_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 2000 && parsed <= 2100) {
          return parsed;
        }
      }
    } catch {
      // ignore storage error
    }
    return currentCalendarYear;
  });

  const [customYears, setCustomYears] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_YEARS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((y) => typeof y === 'number' && y >= 2000 && y <= 2100);
        }
      }
    } catch {
      // ignore storage error
    }
    return [];
  });

  const setActiveYear = (year: number) => {
    if (isNaN(year) || year < 2000 || year > 2100) return;
    setActiveYearState(year);
    try {
      localStorage.setItem(ACTIVE_YEAR_KEY, String(year));
    } catch {
      // ignore
    }
    if (!customYears.includes(year)) {
      const updated = Array.from(new Set([...customYears, year]));
      setCustomYears(updated);
      try {
        localStorage.setItem(CUSTOM_YEARS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const addCustomYear = (year: number) => {
    if (isNaN(year) || year < 2000 || year > 2100) return;
    setCustomYears((prev) => {
      if (prev.includes(year)) return prev;
      const updated = [...prev, year];
      try {
        localStorage.setItem(CUSTOM_YEARS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    setActiveYear(year);
  };

  const availableYears = useMemo(() => {
    const baseYears: number[] = [];
    for (let y = currentCalendarYear - 3; y <= currentCalendarYear + 5; y++) {
      baseYears.push(y);
    }
    const merged = Array.from(new Set([...baseYears, ...customYears, activeYear]));
    return merged.sort((a, b) => b - a);
  }, [currentCalendarYear, customYears, activeYear]);

  return (
    <FiscalYearContext.Provider
      value={{
        currentCalendarYear,
        activeYear,
        setActiveYear,
        availableYears,
        addCustomYear,
      }}
    >
      {children}
    </FiscalYearContext.Provider>
  );
};

export const useFiscalYear = (): FiscalYearContextType => {
  const ctx = useContext(FiscalYearContext);
  if (!ctx) {
    throw new Error('useFiscalYear must be used within a FiscalYearProvider');
  }
  return ctx;
};
