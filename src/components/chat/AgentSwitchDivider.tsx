import {
  makeStyles,
  tokens,
  Text,
} from "@fluentui/react-components";
import { AGENT_CONFIGS, type AgentDomain } from "../../services/agents/agentRegistry";
import { getAgentIcon } from "./agentVisuals";

const useStyles = makeStyles({
  divider: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalXS,
  },
  line: {
    flex: 1,
    height: "1px",
  },
  label: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: "nowrap",
  },
});

interface AgentSwitchDividerProps {
  fromAgent?: AgentDomain;
  toAgent: AgentDomain;
}

export function AgentSwitchDivider({ toAgent }: AgentSwitchDividerProps) {
  const styles = useStyles();

  if (toAgent === "orchestrator") return null;

  const config = AGENT_CONFIGS[toAgent as Exclude<AgentDomain, "orchestrator">];
  if (!config) return null;

  const Icon = getAgentIcon(toAgent);
  const lineColor = config.color + "40"; // 25% opacity

  return (
    <div className={styles.divider}>
      <div className={styles.line} style={{ backgroundColor: lineColor }} />
      <span className={styles.label} style={{ color: config.color }}>
        {Icon && <Icon style={{ width: 14, height: 14 }} />}
        <Text size={100} weight="semibold" style={{ color: "inherit" }}>
          Switched to {config.displayName} Agent
        </Text>
      </span>
      <div className={styles.line} style={{ backgroundColor: lineColor }} />
    </div>
  );
}
