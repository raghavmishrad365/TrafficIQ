import {
  makeStyles,
  tokens,
  Text,
} from "@fluentui/react-components";
import { AGENT_CONFIGS, SPECIALIST_DOMAINS, type AgentDomain } from "../../services/agents/agentRegistry";
import type { AgentStatusInfo } from "../../types/chat";
import { getAgentIcon } from "./agentVisuals";

const useStyles = makeStyles({
  strip: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    overflowX: "auto",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    flexShrink: "0",
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    paddingTop: "3px",
    paddingBottom: "3px",
    paddingLeft: "8px",
    paddingRight: "8px",
    borderRadius: tokens.borderRadiusCircular,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: "nowrap",
    transitionProperty: "all",
    transitionDuration: "200ms",
    lineHeight: tokens.lineHeightBase100,
  },
  pillIdle: {
    backgroundColor: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground3,
  },
  pillActive: {
    color: "#fff",
    animationName: {
      "0%": { opacity: 1 },
      "50%": { opacity: 0.75 },
      "100%": { opacity: 1 },
    },
    animationDuration: "2s",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
  },
  pillCompleted: {
    color: "#fff",
    opacity: 0.8,
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: "0",
  },
});

interface AgentStatusStripProps {
  agentStatuses: AgentStatusInfo[];
  activeAgent: AgentDomain | null;
}

export function AgentStatusStrip({ agentStatuses, activeAgent }: AgentStatusStripProps) {
  const styles = useStyles();

  return (
    <div className={styles.strip}>
      {SPECIALIST_DOMAINS.map((domain) => {
        const config = AGENT_CONFIGS[domain];
        const status = agentStatuses.find((s) => s.domain === domain);
        const isActive = activeAgent === domain;
        const state = status?.state || "idle";
        const Icon = getAgentIcon(domain);

        let pillClass = `${styles.pill} `;
        let pillStyle: React.CSSProperties = {};
        let dotColor = tokens.colorNeutralForeground4;

        if (isActive || state === "active") {
          pillClass += styles.pillActive;
          pillStyle = {
            backgroundColor: config.color,
            boxShadow: `0 0 8px ${config.color}80`,
          };
          dotColor = "#fff";
        } else if (state === "completed") {
          pillClass += styles.pillCompleted;
          pillStyle = { backgroundColor: config.color };
          dotColor = "#fff";
        } else {
          pillClass += styles.pillIdle;
        }

        return (
          <span key={domain} className={pillClass} style={pillStyle}>
            {Icon && <Icon style={{ width: 14, height: 14 }} />}
            <Text size={100} weight="semibold" style={{ color: "inherit" }}>
              {config.displayName}
            </Text>
            <span
              className={styles.statusDot}
              style={{ backgroundColor: dotColor }}
            />
          </span>
        );
      })}
    </div>
  );
}
