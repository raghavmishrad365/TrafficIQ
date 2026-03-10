import React from "react";
import { Text, makeStyles, tokens } from "@fluentui/react-components";
import type { SavedJourney } from "../../types/journey";
import { SavedJourneyCard } from "./SavedJourneyCard";

export interface SavedJourneyListProps {
  journeys: SavedJourney[];
  onNavigate: (journey: SavedJourney) => void;
  onDelete: (id: string) => void;
  onToggleMorningAlert: (journey: SavedJourney) => void;
}

const useStyles = makeStyles({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: tokens.spacingVerticalM,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
});

export const SavedJourneyList: React.FC<SavedJourneyListProps> = ({
  journeys,
  onNavigate,
  onDelete,
  onToggleMorningAlert,
}) => {
  const styles = useStyles();

  if (journeys.length === 0) {
    return (
      <div className={styles.empty}>
        <Text size={400} weight="semibold">
          No saved journeys
        </Text>
        <Text size={300}>
          Save a journey to quickly access it later.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {journeys.map((journey) => (
        <SavedJourneyCard
          key={journey.id}
          journey={journey}
          onNavigate={onNavigate}
          onDelete={onDelete}
          onToggleMorningAlert={onToggleMorningAlert}
        />
      ))}
    </div>
  );
};

export default SavedJourneyList;
