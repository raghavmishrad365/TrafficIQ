import { useState } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Button,
  shorthands,
} from "@fluentui/react-components";
import {
  Checkmark16Regular,
  Dismiss16Regular,
  Search16Regular,
  Map16Regular,
  Warning16Regular,
  VehicleCar16Regular,
  Clock16Regular,
  ArrowRoutingRegular,
  Wrench16Regular,
  ChevronDown16Regular,
  ChevronUp16Regular,
  ArrowSync16Regular,
} from "@fluentui/react-icons";
import type { ToolCallInfo } from "../../types/chat";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXXS,
    alignItems: "center",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
    ...shorthands.padding("2px", tokens.spacingHorizontalS),
    borderRadius: tokens.borderRadiusCircular,
    fontSize: tokens.fontSizeBase100,
    lineHeight: tokens.lineHeightBase100,
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: "nowrap",
  },
  chipExecuting: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  chipCompleted: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    color: tokens.colorPaletteGreenForeground1,
  },
  chipFailed: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
  },
  chipPending: {
    backgroundColor: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground3,
  },
  spinning: {
    animationName: {
      from: { transform: "rotate(0deg)" },
      to: { transform: "rotate(360deg)" },
    },
    animationDuration: "1s",
    animationIterationCount: "infinite",
    animationTimingFunction: "linear",
    display: "inline-flex",
  },
  summary: {
    display: "inline-flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
    ...shorthands.padding("2px", tokens.spacingHorizontalS),
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorPaletteGreenBackground1,
    color: tokens.colorPaletteGreenForeground1,
    fontSize: tokens.fontSizeBase100,
    lineHeight: tokens.lineHeightBase100,
    fontWeight: tokens.fontWeightSemibold,
  },
  expandButton: {
    minWidth: "auto",
    height: "auto",
    ...shorthands.padding("0"),
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
});

const TOOL_ICONS: Record<string, React.ComponentType> = {
  search_traffic: Warning16Regular,
  get_traffic_flow: VehicleCar16Regular,
  plan_journey: Map16Regular,
  search_nearby: Search16Regular,
  get_weather: Clock16Regular,
  compare_routes: ArrowRoutingRegular,
  get_commute_history: Clock16Regular,
  check_commute_status: VehicleCar16Regular,
  monitor_saved_journey: Map16Regular,
  monitor_all_journeys: Map16Regular,
  suggest_reroute: ArrowRoutingRegular,
};

function getToolIcon(name: string): React.ComponentType {
  return TOOL_ICONS[name] || Wrench16Regular;
}

function getChipStyle(
  status: string,
  styles: ReturnType<typeof useStyles>
): string {
  switch (status) {
    case "executing":
      return `${styles.chip} ${styles.chipExecuting}`;
    case "completed":
      return `${styles.chip} ${styles.chipCompleted}`;
    case "failed":
      return `${styles.chip} ${styles.chipFailed}`;
    case "agent":
      return styles.chip; // Agent-tinted: inline styles override colors
    default:
      return `${styles.chip} ${styles.chipPending}`;
  }
}

function StatusIcon({
  status,
  styles,
}: {
  status: string;
  styles: ReturnType<typeof useStyles>;
}) {
  switch (status) {
    case "pending":
    case "executing":
      return (
        <span className={styles.spinning}>
          <ArrowSync16Regular />
        </span>
      );
    case "completed":
      return <Checkmark16Regular />;
    case "failed":
      return <Dismiss16Regular />;
    default:
      return null;
  }
}

interface ToolCallIndicatorProps {
  toolCalls: ToolCallInfo[];
  agentColor?: string;
}

export function ToolCallIndicator({ toolCalls, agentColor }: ToolCallIndicatorProps) {
  const styles = useStyles();
  const [expanded, setExpanded] = useState(false);

  if (toolCalls.length === 0) return null;

  const allDone = toolCalls.every(
    (tc) => tc.status === "completed" || tc.status === "failed"
  );
  const completedCount = toolCalls.filter(
    (tc) => tc.status === "completed"
  ).length;
  const failedCount = toolCalls.filter((tc) => tc.status === "failed").length;

  // Collapsed summary when all done and more than 2 tools
  if (allDone && toolCalls.length > 2 && !expanded) {
    return (
      <div className={styles.container}>
        <span className={styles.summary}>
          <Checkmark16Regular />
          <Text size={100} weight="semibold">
            {completedCount} tool{completedCount !== 1 ? "s" : ""} used
            {failedCount > 0 ? `, ${failedCount} failed` : ""}
          </Text>
        </span>
        <Button
          appearance="transparent"
          className={styles.expandButton}
          onClick={() => setExpanded(true)}
          icon={<ChevronDown16Regular />}
          size="small"
          title="Show details"
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {toolCalls.map((tc) => {
        const Icon = getToolIcon(tc.name);
        // Use agent color for executing/pending chips
        const useAgentTint = agentColor && (tc.status === "executing" || tc.status === "pending");
        const chipStyle: React.CSSProperties | undefined = useAgentTint
          ? { backgroundColor: agentColor + "1F", color: agentColor, borderLeft: `2px solid ${agentColor}` }
          : undefined;

        return (
          <span
            key={tc.id}
            className={getChipStyle(useAgentTint ? "agent" : tc.status, styles)}
            style={chipStyle}
          >
            <Icon />
            <Text size={100}>{formatToolName(tc.name)}</Text>
            <StatusIcon status={tc.status} styles={styles} />
          </span>
        );
      })}
      {allDone && toolCalls.length > 2 && expanded && (
        <Button
          appearance="transparent"
          className={styles.expandButton}
          onClick={() => setExpanded(false)}
          icon={<ChevronUp16Regular />}
          size="small"
          title="Collapse"
        />
      )}
    </div>
  );
}

function formatToolName(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
