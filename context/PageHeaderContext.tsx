"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

interface PageHeaderValue {
  title: string;
  subtitle?: string;
}

interface PageHeaderContextType {
  header: PageHeaderValue;
  setHeader: (v: PageHeaderValue) => void;
}

const PageHeaderContext = createContext<PageHeaderContextType>({
  header: { title: "" },
  setHeader: () => {},
});

export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
  const [header, setHeaderState] = useState<PageHeaderValue>({ title: "" });
  const setHeader = useCallback((v: PageHeaderValue) => setHeaderState(v), []);
  return (
    <PageHeaderContext.Provider value={{ header, setHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

// Pages call this hook with their title/subtitle to register on mount
export function usePageHeader(value: PageHeaderValue) {
  const { setHeader } = useContext(PageHeaderContext);
  useEffect(() => {
    setHeader(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.title, value.subtitle]);
}

// Topbar calls this to read the current header
export function useCurrentPageHeader() {
  return useContext(PageHeaderContext).header;
}
