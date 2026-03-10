import { makeStyles, Badge } from "@fluentui/react-components";
import type { Severity } from "../../types/traffic";

const useStyles = makeStyles({
  badge: {
    textTransform: "capitalize" as const,
  },
});

interface TrafficBadgeProps {
  severity: Severity;
}

export function TrafficBadge({ severity }: TrafficBadgeProps) {
  const styles = useStyles();

  const colorMap: Record<Severity, "success" | "warning" | "danger" | "important"> = {
    low: "success",
    medium: "warning",
    high: "danger",
    critical: "important",
  };

  return (
    <Badge
      appearance="filled"
      color={colorMap[severity]}
      className={styles.badge}
    >
      {severity}
    </Badge>
  );
}
