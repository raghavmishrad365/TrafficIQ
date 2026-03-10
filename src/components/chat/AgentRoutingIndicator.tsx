import {
  makeStyles,
  tokens,
  Text,
} from "@fluentui/react-components";
import { ArrowRight16Regular } from "@fluentui/react-icons";
import { AGENT_CONFIGS, type AgentDomain } from "../../services/agents/agentRegistry";
import type { RoutingInfo } from "../../types/chat";
import { getAgentIcon } from "./agentVisuals";

const useStyles = makeStyles({
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingHorizontalXS,
    paddingTop: tokens.spacingVerticalXXS,
    paddingBottom: tokens.spacingVerticalXXS,
    animationName: {
      from: { opacity: 0, transform: "translateY(-4px)" },
      to: { opacity: 1, transform: "translateY(0)" },
    },
    animationDuration: "300ms",
    animationFillMode: "forwards",
  },
  line: {
    width: "20px",
    height: "1px",
    backgroundColor: tokens.colorNeutralStroke2,
  },
  agentLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    fontWeight: tokens.fontWeightSemibold,
  },
  tierLabel: {
    fontStyle: "italic",
    color: tokens.colorNeutralForeground4,
  },
});

const TIER_LABELS: Record<string, string> = {
  sticky: "follow-up",
  keyword: "keyword match",
  llm: "AI routed",
};

export function AgentRoutingIndicator({ routingInfo }: { routingInfo: RoutingInfo }) {
  const styles = useStyles();

  const domain = routingInfo.toAgent as Exclude<AgentDomain, "orchestrator">;
  const config = AGENT_CONFIGS[domain];
  if (!config) return null;

  const Icon = getAgentIcon(routingInfo.toAgent);
  const tierLabel = TIER_LABELS[routingInfo.tierName] || routingInfo.tierName;

  return (
    <div className={styles.container}>
      <div className={styles.line} />
      <ArrowRight16Regular style={{ color: tokens.colorNeutralForeground4, flexShrink: 0 }} />
      {Icon && <Icon style={{ color: config.color, width: 14, height: 14, flexShrink: 0 }} />}
      <Text size={100} className={styles.agentLabel} style={{ color: config.color }}>
        {config.displayName}
      </Text>
      <Text size={100} className={styles.tierLabel}>({tierLabel})</Text>
      <div className={styles.line} />
    </div>
  );
}
