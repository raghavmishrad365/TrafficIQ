import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { RouteOption, Location } from "../types/journey";

interface PlannedJourney {
  origin: Location;
  destination: Location;
  routes: RouteOption[];
  recommendations: string[];
}

interface JourneyContextValue {
  activeJourney: RouteOption | null;
  setActiveJourney: (journey: RouteOption) => void;
  clearActiveJourney: () => void;
  plannedJourney: PlannedJourney | null;
  setPlannedJourney: (planned: PlannedJourney) => void;
  clearPlannedJourney: () => void;
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

export const JourneyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeJourney, setActiveJourneyState] = useState<RouteOption | null>(null);
  const [plannedJourney, setPlannedJourneyState] = useState<PlannedJourney | null>(null);

  const setActiveJourney = useCallback((journey: RouteOption) => {
    setActiveJourneyState(journey);
  }, []);

  const clearActiveJourney = useCallback(() => {
    setActiveJourneyState(null);
  }, []);

  const setPlannedJourney = useCallback((planned: PlannedJourney) => {
    setPlannedJourneyState(planned);
  }, []);

  const clearPlannedJourney = useCallback(() => {
    setPlannedJourneyState(null);
  }, []);

  const value = useMemo<JourneyContextValue>(
    () => ({
      activeJourney,
      setActiveJourney,
      clearActiveJourney,
      plannedJourney,
      setPlannedJourney,
      clearPlannedJourney,
    }),
    [activeJourney, setActiveJourney, clearActiveJourney, plannedJourney, setPlannedJourney, clearPlannedJourney]
  );

  return (
    <JourneyContext.Provider value={value}>
      {children}
    </JourneyContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useJourneyContext(): JourneyContextValue {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error(
      "useJourneyContext must be used within a JourneyProvider"
    );
  }
  return context;
}
