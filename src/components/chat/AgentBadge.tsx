import {
  makeStyles,
  tokens,
  Text,
} from "@fluentui/react-components";
import { AGENT_CONFIGS, type AgentDomain } from "../../services/agents/agentRegistry";
import { getAgentIcon, getAgentColor } from "./agentVisuals";

const useStyles = makeStyles({
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    paddingLeft: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalXXS,
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
    lineHeight: tokens.lineHeightBase100,
  },
  toolCount: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    backgroundColor: tokens.colorNeutralBackground4,
    paddingTop: "1px",
    paddingBottom: "1px",
    paddingLeft: "6px",
    paddingRight: "6px",
    borderRadius: tokens.borderRadiusCircular,
    lineHeight: tokens.lineHeightBase100,
  },
});

interface AgentBadgeProps {
  domain: AgentDomain;
  displayName?: string;
  toolCount?: number;
}

export function AgentBadge({ domain, displayName, toolCount }: AgentBadgeProps) {
  const styles = useStyles();

  if (domain === "orchestrator") return null;

  const config = AGENT_CONFIGS[domain];
  if (!config) return null;

  const color = getAgentColor(domain);
  const Icon = getAgentIcon(domain);

  return (
    <div className={styles.header} style={{ borderLeftColor: color }}>
      <div className={styles.headerTop}>
        {Icon && <Icon style={{ color, width: 16, height: 16, flexShrink: 0 }} />}
        <Text weight="semibold" size={200} style={{ color }}>
          {displayName || config.displayName} Agent
        </Text>
        {toolCount != null && toolCount > 0 && (
          <Text className={styles.toolCount}>
            {toolCount} tool{toolCount !== 1 ? "s" : ""}
          </Text>
        )}
      </div>
      <Text className={styles.subtitle}>{config.subtitle}</Text>
    </div>
  );
}
