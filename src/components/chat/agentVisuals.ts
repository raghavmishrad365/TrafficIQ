import {
  VehicleCar16Regular,
  Box16Regular,
  VehicleTruckProfile16Regular,
  Wrench16Regular,
  PersonWrench20Regular,
  LocationRipple16Regular,
} from "@fluentui/react-icons";
import { AGENT_CONFIGS, type AgentDomain } from "../../services/agents/agentRegistry";

/** Icon component mapping for each agent domain */
const AGENT_ICON_MAP: Record<Exclude<AgentDomain, "orchestrator">, React.ComponentType<{ style?: React.CSSProperties }>> = {
  traffic: VehicleCar16Regular,
  supplychain: Box16Regular,
  fleet: VehicleTruckProfile16Regular,
  operations: Wrench16Regular,
  fieldservice: PersonWrench20Regular,
  iotlogistics: LocationRipple16Regular,
};

/** Get the Fluent UI icon component for an agent domain */
export function getAgentIcon(domain: AgentDomain): React.ComponentType<{ style?: React.CSSProperties }> | null {
  if (domain === "orchestrator") return null;
  return AGENT_ICON_MAP[domain] || null;
}

/** Get the brand color for an agent domain from AGENT_CONFIGS */
export function getAgentColor(domain: AgentDomain): string {
  if (domain === "orchestrator") return "#505050";
  return AGENT_CONFIGS[domain]?.color || "#505050";
}
