import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Spinner,
  Badge,
  shorthands,
} from "@fluentui/react-components";
import {
  Warning20Regular,
  ErrorCircle20Regular,
  Clock20Regular,
  CellularData120Regular,
} from "@fluentui/react-icons";
import type { TrafficSummaryData, CongestionLevel } from "../../types/traffic";
import { formatDuration, formatRelativeTime } from "../../utils/formatters";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    boxShadow: tokens.shadow2,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalS,
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalS),
    borderRadius: tokens.borderRadiusMedium,
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
  },
  statIcon: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
  },
  statNeutral: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderLeftColor: tokens.colorBrandBackground,
  },
  statCritical: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderLeftColor: tokens.colorPaletteRedBorder1,
  },
  statDelay: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    borderLeftColor: tokens.colorPaletteYellowBorder1,
  },
  statCongestion: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderLeftColor: tokens.colorNeutralStroke1,
  },
  statCongestionFree: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    borderLeftColor: tokens.colorPaletteGreenBorder1,
  },
  statCongestionHeavy: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderLeftColor: tokens.colorPaletteRedBorder1,
  },
  loader: {
    display: "flex",
    justifyContent: "center",
    ...shorthands.padding(tokens.spacingVerticalL),
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    color: tokens.colorNeutralForeground3,
  },
  // Compact mode styles (for dashboard overlay)
  compactRoot: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  compactHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalS,
  },
  compactGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalXS,
  },
  compactStat: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
  },
  compactFooter: {
    color: tokens.colorNeutralForeground4,
  },
});

const congestionColors: Record<CongestionLevel, "success" | "warning" | "danger" | "important" | "informative"> = {
  free: "success",
  light: "success",
  moderate: "warning",
  heavy: "danger",
  severe: "important",
};

function getCongestionStatStyle(level: CongestionLevel, styles: ReturnType<typeof useStyles>): string {
  switch (level) {
    case "free":
    case "light":
      return `${styles.stat} ${styles.statCongestionFree}`;
    case "heavy":
    case "severe":
      return `${styles.stat} ${styles.statCongestionHeavy}`;
    default:
      return `${styles.stat} ${styles.statCongestion}`;
  }
}

interface TrafficSummaryProps {
  summary?: TrafficSummaryData;
  isLoading?: boolean;
  compact?: boolean;
}

function CompactTrafficSummary({ summary, isLoading }: { summary?: TrafficSummaryData; isLoading?: boolean }) {
  const styles = useStyles();

  if (isLoading) {
    return <Spinner size="tiny" label="Loading..." />;
  }

  if (!summary) return null;

  return (
    <div className={styles.compactRoot}>
      <div className={styles.compactHeader}>
        <Text size={300} weight="semibold">Traffic</Text>
        <Badge
          appearance="filled"
          color={congestionColors[summary.congestionLevel]}
          size="small"
          style={{ textTransform: "capitalize" }}
        >
          {summary.congestionLevel}
        </Badge>
      </div>
      <div className={styles.compactGrid}>
        <div className={styles.compactStat}>
          <Warning20Regular style={{ fontSize: 14 }} />
          <Text size={200}>{summary.totalIncidents} incidents</Text>
        </div>
        <div className={styles.compactStat}>
          <ErrorCircle20Regular style={{ fontSize: 14, color: summary.criticalIncidents > 0 ? "var(--traffic-severe)" : undefined }} />
          <Text size={200}>{summary.criticalIncidents} critical</Text>
        </div>
        <div className={styles.compactStat}>
          <Clock20Regular style={{ fontSize: 14 }} />
          <Text size={200}>{formatDuration(summary.averageDelay)} avg</Text>
        </div>
        <div className={styles.compactStat}>
          <CellularData120Regular style={{ fontSize: 14 }} />
          <Text size={200} style={{ textTransform: "capitalize" }}>{summary.congestionLevel}</Text>
        </div>
      </div>
      <Text size={100} className={styles.compactFooter}>
        Updated {formatRelativeTime(summary.lastUpdated)}
      </Text>
    </div>
  );
}

export function TrafficSummary({ summary, isLoading, compact }: TrafficSummaryProps) {
  const styles = useStyles();

  if (compact) {
    return <CompactTrafficSummary summary={summary} isLoading={isLoading} />;
  }

  if (isLoading) {
    return (
      <div className={styles.loader}>
        <Spinner size="small" label="Loading traffic data..." />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <Card className={styles.root}>
      <CardHeader
        header={<Text weight="semibold">Traffic Overview</Text>}
        action={
          <Badge
            appearance="filled"
            color={congestionColors[summary.congestionLevel]}
            style={{ textTransform: "capitalize" }}
          >
            {summary.congestionLevel}
          </Badge>
        }
      />
      <div className={styles.statsGrid}>
        <div className={`${styles.stat} ${styles.statNeutral}`}>
          <div className={styles.statIcon}>
            <Warning20Regular />
            <Text size={200}>Total Incidents</Text>
          </div>
          <Text size={600} weight="semibold">
            {summary.totalIncidents}
          </Text>
        </div>
        <div className={`${styles.stat} ${summary.criticalIncidents > 0 ? styles.statCritical : styles.statNeutral}`}>
          <div className={styles.statIcon}>
            <ErrorCircle20Regular />
            <Text size={200}>Critical</Text>
          </div>
          <Text
            size={600}
            weight="semibold"
            style={{ color: summary.criticalIncidents > 0 ? "var(--traffic-severe)" : undefined }}
          >
            {summary.criticalIncidents}
          </Text>
        </div>
        <div className={`${styles.stat} ${styles.statDelay}`}>
          <div className={styles.statIcon}>
            <Clock20Regular />
            <Text size={200}>Avg. Delay</Text>
          </div>
          <Text size={600} weight="semibold">
            {formatDuration(summary.averageDelay)}
          </Text>
        </div>
        <div className={getCongestionStatStyle(summary.congestionLevel, styles)}>
          <div className={styles.statIcon}>
            <CellularData120Regular />
            <Text size={200}>Congestion</Text>
          </div>
          <Text
            size={600}
            weight="semibold"
            style={{ textTransform: "capitalize" }}
          >
            {summary.congestionLevel}
          </Text>
        </div>
      </div>
      <div className={styles.footer}>
        <Text size={200}>
          Updated {formatRelativeTime(summary.lastUpdated)}
        </Text>
      </div>
    </Card>
  );
}
