import { useRef, useEffect } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Button,
  shorthands,
} from "@fluentui/react-components";
import {
  Dismiss24Regular,
  Add24Regular,
  Bot24Regular,
  VehicleCar20Regular,
  VehicleTruckProfile20Regular,
  Warning20Regular,
  Bookmark20Regular,
  Sparkle20Regular,
  Box20Regular,
  DataTrending20Regular,
  Wrench20Regular,
  CalendarLtr20Regular,
  Search20Regular,
  Heart20Regular,
  ArrowUndo20Regular,
  ArrowExpand20Regular,
  Location20Regular,
  Map20Regular,
  WeatherRainShowersDay20Regular,
  PlugConnected20Regular,
  PersonWrench20Regular,
} from "@fluentui/react-icons";
import { useChat } from "../../context/ChatContext";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { AGENT_CONFIGS } from "../../services/agents/agentRegistry";
import { AgentStatusStrip } from "./AgentStatusStrip";
import { AgentRoutingIndicator } from "./AgentRoutingIndicator";
import { AgentSwitchDivider } from "./AgentSwitchDivider";
import { ChatPanelToolbar } from "./ChatPanelToolbar";
import { useFloatDrag, useFloatResize } from "./useFloatDrag";
import type { ChatMessage as ChatMessageType } from "../../types/chat";
import type { AgentDomain } from "../../services/agents/agentRegistry";

const useStyles = makeStyles({
  overlay: {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    backgroundColor: "var(--chat-overlay, rgba(0,0,0,0.4))",
    zIndex: 999,
    animationName: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    animationDuration: "200ms",
    animationFillMode: "forwards",
  },
  // --- Docked Right (default) ---
  panelDockedRight: {
    position: "fixed",
    top: "0",
    right: "0",
    bottom: "0",
    width: "460px",
    maxWidth: "100vw",
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow64,
    borderLeftWidth: "1px",
    borderLeftStyle: "solid",
    borderLeftColor: tokens.colorNeutralStroke1,
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    animationName: {
      from: { transform: "translateX(100%)" },
      to: { transform: "translateX(0)" },
    },
    animationDuration: "250ms",
    animationTimingFunction: "cubic-bezier(0.33, 1, 0.68, 1)",
    animationFillMode: "forwards",
    "@media (max-width: 640px)": {
      width: "100vw",
    },
  },
  // --- Docked Left ---
  panelDockedLeft: {
    position: "fixed",
    top: "0",
    left: "0",
    bottom: "0",
    width: "460px",
    maxWidth: "100vw",
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow64,
    borderRightWidth: "1px",
    borderRightStyle: "solid",
    borderRightColor: tokens.colorNeutralStroke1,
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    animationName: {
      from: { transform: "translateX(-100%)" },
      to: { transform: "translateX(0)" },
    },
    animationDuration: "250ms",
    animationTimingFunction: "cubic-bezier(0.33, 1, 0.68, 1)",
    animationFillMode: "forwards",
    "@media (max-width: 640px)": {
      width: "100vw",
    },
  },
  // --- Floating ---
  panelFloating: {
    position: "fixed",
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow64,
    ...shorthands.borderWidth("1px"),
    ...shorthands.borderStyle("solid"),
    ...shorthands.borderColor(tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusXLarge,
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    animationName: {
      from: { opacity: 0, transform: "scale(0.95)" },
      to: { opacity: 1, transform: "scale(1)" },
    },
    animationDuration: "200ms",
    animationFillMode: "forwards",
  },
  // --- Expanded ---
  panelExpanded: {
    position: "fixed",
    top: "0",
    right: "0",
    bottom: "0",
    width: "60vw",
    minWidth: "500px",
    maxWidth: "100vw",
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow64,
    borderLeftWidth: "1px",
    borderLeftStyle: "solid",
    borderLeftColor: tokens.colorNeutralStroke1,
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    animationName: {
      from: { transform: "translateX(30%)", opacity: 0 },
      to: { transform: "translateX(0)", opacity: 1 },
    },
    animationDuration: "250ms",
    animationTimingFunction: "cubic-bezier(0.33, 1, 0.68, 1)",
    animationFillMode: "forwards",
  },
  // --- Minimized bar ---
  minimizedBar: {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    width: "320px",
    height: "44px",
    borderRadius: "22px",
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow16,
    ...shorthands.borderWidth("1px"),
    ...shorthands.borderStyle("solid"),
    ...shorthands.borderColor(tokens.colorNeutralStroke1),
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    ...shorthands.padding("0", tokens.spacingHorizontalM),
    animationName: {
      from: { opacity: 0, transform: "translateY(20px)" },
      to: { opacity: 1, transform: "translateY(0)" },
    },
    animationDuration: "200ms",
    animationFillMode: "forwards",
  },
  minimizedAvatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: tokens.colorBrandBackground,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: tokens.colorNeutralForegroundOnBrand,
    flexShrink: "0",
  },
  minimizedLabel: {
    flexGrow: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  // --- Resize handle ---
  resizeHandle: {
    position: "absolute",
    bottom: "0",
    right: "0",
    width: "16px",
    height: "16px",
    cursor: "nwse-resize",
    opacity: 0.4,
    ":hover": {
      opacity: 0.8,
    },
  },
  resizeTriangle: {
    position: "absolute",
    bottom: "2px",
    right: "2px",
    width: "0",
    height: "0",
  },
  // --- Shared inner styles ---
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalL),
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground2}, ${tokens.colorNeutralBackground1})`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: "0",
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
  },
  botAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: tokens.colorBrandBackground,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: tokens.colorNeutralForegroundOnBrand,
    boxShadow: `0 0 0 2px ${tokens.colorBrandBackground2}`,
    flexShrink: "0",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    flexShrink: "0",
  },
  messagesArea: {
    flexGrow: 1,
    overflowY: "auto",
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  welcome: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    gap: tokens.spacingVerticalL,
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalL),
    textAlign: "center",
  },
  welcomeIcon: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackground2})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: tokens.colorNeutralForegroundOnBrand,
    boxShadow: tokens.shadow16,
  },
  welcomeText: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  suggestions: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    width: "100%",
    maxWidth: "360px",
  },
  suggestionGroup: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  suggestionGroupLabel: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
    color: tokens.colorNeutralForeground3,
    ...shorthands.padding("0", tokens.spacingHorizontalXS),
  },
  suggestion: {
    textAlign: "left",
    justifyContent: "flex-start",
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
    ...shorthands.borderColor("transparent"),
    ":hover": {
      backgroundColor: tokens.colorBrandBackground2,
      color: tokens.colorBrandForeground1,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
  },
  error: {
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.margin("0", tokens.spacingHorizontalM),
  },
  inputArea: {
    flexShrink: "0",
  },
  footer: {
    display: "flex",
    justifyContent: "center",
    ...shorthands.padding(tokens.spacingVerticalXS),
    color: tokens.colorNeutralForeground4,
  },
});

const PROMPT_CATEGORIES = [
  {
    label: "Analytics",
    icon: DataTrending20Regular,
    prompts: [
      "Show me supply chain KPIs",
      "What are the current exception alerts?",
      "Compare this week's delivery performance vs last week",
    ],
  },
  {
    label: "Shipments",
    icon: VehicleTruckProfile20Regular,
    prompts: [
      "Show today's shipments from warehouse DK01",
      "Which deliveries are currently delayed?",
      "What's the delivery schedule for this week?",
      "Update ETAs for all active shipments",
    ],
  },
  {
    label: "Fleet",
    icon: VehicleCar20Regular,
    prompts: [
      "Show fleet status for all vehicles",
      "How are our drivers performing today?",
      "Which vehicles are currently idle?",
      "Show fuel levels across the fleet",
    ],
  },
  {
    label: "Work Orders",
    icon: Wrench20Regular,
    prompts: [
      "Show unscheduled work orders",
      "Which technicians are available?",
      "Assign work order WO-2026-003 to the best technician",
      "Show all high-priority work orders",
    ],
  },
  {
    label: "Inventory",
    icon: Box20Regular,
    prompts: [
      "Any items below reorder point?",
      "Check inventory at warehouse DK01",
      "Show stock levels for warehouse DK02",
    ],
  },
  {
    label: "Delivery Routes",
    icon: Map20Regular,
    prompts: [
      "Plan delivery route for pending shipments from DK01",
      "Optimize today's delivery routes",
      "Compare truck vs car route from Copenhagen to Aarhus",
    ],
  },
  {
    label: "Traffic Impact",
    icon: Warning20Regular,
    prompts: [
      "How is traffic affecting our deliveries?",
      "Show traffic incidents near Copenhagen",
      "Are there any road closures on the E45 motorway?",
    ],
  },
  {
    label: "My Journeys",
    icon: Bookmark20Regular,
    prompts: [
      "How are my saved routes looking?",
      "Find a faster route for my commute",
      "Save a new journey from Odense to Copenhagen",
      "Check commute status for my morning route",
    ],
  },
  {
    label: "Route Planning",
    icon: Location20Regular,
    prompts: [
      "Plan a journey from Copenhagen to Aarhus",
      "Find gas stations along the route to Odense",
      "What's the reachable range from Aalborg in 30 minutes?",
      "Snap GPS positions to nearest roads",
    ],
  },
  {
    label: "Weather & POI",
    icon: WeatherRainShowersDay20Regular,
    prompts: [
      "What's the weather along the route to Aarhus?",
      "Find rest areas between Copenhagen and Odense",
      "Are there truck stops near Kolding?",
    ],
  },
  {
    label: "Scheduling",
    icon: CalendarLtr20Regular,
    prompts: [
      "Show today's scheduling board",
      "Who should handle unscheduled work order WO-2026-003?",
      "Optimize the schedule for available technicians",
    ],
  },
  {
    label: "Tracking",
    icon: Search20Regular,
    prompts: [
      "Track shipment SH-2026-001",
      "Show proof of delivery for SH-2026-004",
      "Check status of shipment SH-2026-003",
    ],
  },
  {
    label: "Maintenance",
    icon: Heart20Regular,
    prompts: [
      "Show fleet health scores",
      "Which vehicles have critical maintenance alerts?",
      "Show maintenance history for TRK-105",
      "What's the predicted next failure for our fleet?",
    ],
  },
  {
    label: "Returns",
    icon: ArrowUndo20Regular,
    prompts: [
      "Show all open returns",
      "Approve return RET-2026-002",
      "What are the top return reasons this month?",
    ],
  },
  {
    label: "IoT & Devices",
    icon: PlugConnected20Regular,
    prompts: [
      "Show all IoT device statuses",
      "Any GPS trackers offline right now?",
      "Show geofence alerts for warehouse zones",
      "Check driving behavior alerts for today",
    ],
  },
  {
    label: "Field Service",
    icon: PersonWrench20Regular,
    prompts: [
      "Show active service requests",
      "Dispatch a technician for the critical HVAC issue",
      "What's our first-fix rate this month?",
      "Show customer assets with expired warranties",
    ],
  },
];

/** Find the agentDomain of the most recent assistant message before the given index */
function getPreviousAssistantDomain(
  messages: ChatMessageType[],
  currentIndex: number
): AgentDomain | undefined {
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (messages[i].role === "assistant" && messages[i].agentDomain) {
      return messages[i].agentDomain;
    }
  }
  return undefined;
}

export function ChatPanel() {
  const styles = useStyles();
  const {
    messages,
    isOpen,
    isProcessing,
    error,
    activeAgent,
    agentStatuses,
    panelLayout,
    setLayoutMode,
    updateFloatPosition,
    updateFloatSize,
    closeChat,
    sendMessage,
    newConversation,
  } = useChat();

  const activeConfig = activeAgent && activeAgent !== "orchestrator"
    ? AGENT_CONFIGS[activeAgent]
    : null;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isFloating = panelLayout.mode === "floating";

  const { dragHandleProps } = useFloatDrag({
    onDrag: updateFloatPosition,
    enabled: isFloating,
  });

  const { resizeHandleProps } = useFloatResize({
    onResize: updateFloatSize,
    enabled: isFloating,
    minWidth: 360,
    minHeight: 400,
  });

  if (!isOpen) return null;

  // --- Minimized mode: compact bar ---
  if (panelLayout.mode === "minimized") {
    return (
      <div className={styles.minimizedBar}>
        <div className={styles.minimizedAvatar}>
          <Bot24Regular style={{ width: 18, height: 18 }} />
        </div>
        <Text size={200} weight="semibold" className={styles.minimizedLabel}>
          TRAFI {activeConfig ? `\u2014 ${activeConfig.displayName}` : ""}
        </Text>
        <ChatPanelToolbar currentMode="minimized" onModeChange={setLayoutMode} />
        <Button
          appearance="subtle"
          size="small"
          icon={<ArrowExpand20Regular />}
          onClick={() => setLayoutMode(panelLayout.previousMode)}
          title="Restore"
          aria-label="Restore chat panel"
        />
      </div>
    );
  }

  // --- Panel class and inline style per mode ---
  let panelClass: string;
  let panelStyle: React.CSSProperties | undefined;
  const showOverlay = false; // Never block the main page — keep it interactive

  switch (panelLayout.mode) {
    case "docked-left":
      panelClass = styles.panelDockedLeft;
      break;
    case "floating":
      panelClass = styles.panelFloating;
      panelStyle = {
        top: panelLayout.floatY,
        left: panelLayout.floatX,
        width: panelLayout.floatWidth,
        height: panelLayout.floatHeight,
      };
      break;
    case "expanded":
      panelClass = styles.panelExpanded;
      break;
    default: // docked-right
      panelClass = styles.panelDockedRight;
      break;
  }

  return (
    <>
      {showOverlay && <div className={styles.overlay} onClick={closeChat} />}
      <div
        className={panelClass}
        style={panelStyle}
        data-float-panel=""
      >
        {/* Header */}
        <div
          className={styles.header}
          {...(isFloating ? dragHandleProps : {})}
          style={isFloating ? { ...dragHandleProps.style, userSelect: "none" } : undefined}
        >
          <div className={styles.headerTitle}>
            <div className={styles.botAvatar}>
              <Bot24Regular style={{ width: 20, height: 20 }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <Text weight="semibold" size={400}>
                TRAFI
              </Text>
              <Text
                size={200}
                style={{
                  color: tokens.colorNeutralForeground3,
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {activeConfig ? `${activeConfig.displayName} Agent` : "Multi-Agent Supply Chain Assistant"}
              </Text>
            </div>
          </div>
          <div className={styles.headerRight}>
            <ChatPanelToolbar currentMode={panelLayout.mode} onModeChange={setLayoutMode} />
            <Button
              appearance="subtle"
              icon={<Add24Regular />}
              onClick={() => newConversation()}
              title="New conversation"
              size="small"
            />
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              onClick={closeChat}
              aria-label="Close chat"
              size="small"
            />
          </div>
        </div>

        {/* Agent Status Strip */}
        <AgentStatusStrip agentStatuses={agentStatuses} activeAgent={activeAgent} />

        {/* Error banner */}
        {error && (
          <div className={styles.error}>
            <Text size={300}>{error}</Text>
          </div>
        )}

        {/* Messages area */}
        <div className={styles.messagesArea}>
          {messages.length === 0 ? (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}>
                <Sparkle20Regular style={{ width: 36, height: 36 }} />
              </div>
              <div className={styles.welcomeText}>
                <Text size={500} weight="semibold">
                  How can I help?
                </Text>
                <Text size={400} style={{ color: tokens.colorNeutralForeground3 }}>
                  Ask about analytics, fleet, work orders, inventory, or shipments.
                </Text>
              </div>
              <div className={styles.suggestions}>
                {PROMPT_CATEGORIES.map((category) => (
                  <div key={category.label} className={styles.suggestionGroup}>
                    <div className={styles.suggestionGroupLabel}>
                      <category.icon />
                      <Text size={200} weight="semibold">
                        {category.label}
                      </Text>
                    </div>
                    {category.prompts.map((prompt) => (
                      <Button
                        key={prompt}
                        appearance="outline"
                        className={styles.suggestion}
                        onClick={() => sendMessage(prompt)}
                        disabled={isProcessing}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isAssistant = msg.role === "assistant";
              const prevAssistantDomain = getPreviousAssistantDomain(messages, index);
              const agentChanged = isAssistant && !!msg.agentDomain && !!prevAssistantDomain && msg.agentDomain !== prevAssistantDomain;
              const showAgentHeader = isAssistant && !!msg.agentDomain && (!prevAssistantDomain || msg.agentDomain !== prevAssistantDomain);

              return (
                <div key={msg.id}>
                  {/* Agent switch divider */}
                  {agentChanged && msg.agentDomain && (
                    <AgentSwitchDivider
                      fromAgent={prevAssistantDomain}
                      toAgent={msg.agentDomain}
                    />
                  )}

                  {/* Routing indicator */}
                  {isAssistant && msg.routingInfo && (
                    <AgentRoutingIndicator routingInfo={msg.routingInfo} />
                  )}

                  {/* The message */}
                  <ChatMessage
                    message={msg}
                    showAgentHeader={showAgentHeader}
                  />
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={styles.inputArea}>
          <ChatInput onSend={sendMessage} disabled={isProcessing} />
          <div className={styles.footer}>
            <Text size={100}>Powered by Microsoft Foundry — Multi-Agent</Text>
          </div>
        </div>

        {/* Resize handle (floating mode only) */}
        {isFloating && (
          <div className={styles.resizeHandle} {...resizeHandleProps}>
            <div
              className={styles.resizeTriangle}
              style={{
                borderStyle: "solid",
                borderWidth: "0 0 10px 10px",
                borderColor: `transparent transparent ${tokens.colorNeutralStroke1} transparent`,
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
