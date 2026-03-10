import {
  makeStyles,
  tokens,
  Card,
  Text,
  shorthands,
} from "@fluentui/react-components";
import type { TrafficIncident } from "../../types/traffic";
import { TrafficBadge } from "./TrafficBadge";
import { formatDuration } from "../../utils/formatters";

const severityColors: Record<string, string> = {
  low: tokens.colorPaletteGreenBorder1,
  medium: tokens.colorPaletteYellowBorder1,
  high: tokens.colorPaletteDarkOrangeBorder1,
  critical: tokens.colorPaletteRedBorder1,
};

const useStyles = makeStyles({
  card: {
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    borderLeftWidth: "4px",
    borderLeftStyle: "solid",
    transitionProperty: "box-shadow, transform",
    transitionDuration: "150ms",
    ":hover": {
      boxShadow: tokens.shadow4,
    },
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalXS,
  },
  meta: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground3,
  },
  type: {
    textTransform: "capitalize" as const,
  },
});

interface IncidentCardProps {
  incident: TrafficIncident;
  compact?: boolean;
}

export function IncidentCard({ incident, compact }: IncidentCardProps) {
  const styles = useStyles();
  const borderColor = severityColors[incident.severity] ?? tokens.colorNeutralStroke1;

  return (
    <Card
      className={styles.card}
      size="small"
      style={{ borderLeftColor: borderColor }}
    >
      <div className={styles.header}>
        <Text weight="semibold" size={compact ? 200 : 300}>
          {incident.title}
        </Text>
        <TrafficBadge severity={incident.severity} />
      </div>
      {!compact && incident.description && (
        <Text size={200}>{incident.description}</Text>
      )}
      <div className={styles.meta}>
        <Text size={200} className={styles.type}>
          {incident.type}
        </Text>
        {incident.roadName && (
          <Text size={200}>{incident.roadName}</Text>
        )}
        {incident.delayMinutes != null && incident.delayMinutes > 0 && (
          <Text size={200}>Delay: {formatDuration(incident.delayMinutes)}</Text>
        )}
      </div>
    </Card>
  );
}
