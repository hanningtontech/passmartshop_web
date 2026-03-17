import React, { createContext, useContext } from "react";

interface UiContextType {
  hideFeatures: boolean;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

export const UiProvider = UiContext.Provider;

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) return { hideFeatures: false };
  return ctx;
}

