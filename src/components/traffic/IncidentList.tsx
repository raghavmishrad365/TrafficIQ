import { makeStyles, tokens, Text, Spinner } from "@fluentui/react-components";
import type { TrafficIncident, Severity } from "../../types/traffic";
import { IncidentCard } from "./IncidentCard";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacingVerticalL,
  },
  loader: {
    display: "flex",
    justifyContent: "center",
    padding: tokens.spacingVerticalL,
  },
});

const severityOrder: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface IncidentListProps {
  incidents: TrafficIncident[];
  isLoading?: boolean;
  maxItems?: number;
  compact?: boolean;
}

export function IncidentList({
  incidents,
  isLoading,
  maxItems,
  compact,
}: IncidentListProps) {
  const styles = useStyles();

  if (isLoading) {
    return (
      <div className={styles.loader}>
        <Spinner size="small" label="Loading incidents..." />
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className={styles.empty}>
        <Text size={300}>No incidents reported</Text>
      </div>
    );
  }

  const sorted = [...incidents].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
  const display = maxItems ? sorted.slice(0, maxItems) : sorted;

  return (
    <div className={styles.root}>
      {display.map((incident) => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          compact={compact}
        />
      ))}
      {maxItems && sorted.length > maxItems && (
        <Text size={200} align="center">
          +{sorted.length - maxItems} more incidents
        </Text>
      )}
    </div>
  );
}
