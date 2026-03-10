import {
  makeStyles,
  tokens,
  Text,
  shorthands,
} from "@fluentui/react-components";
import {
  Bot20Regular,
  Person20Regular,
} from "@fluentui/react-icons";
import type { ChatMessage as ChatMessageType, ToolCallInfo } from "../../types/chat";
import { ToolCallIndicator } from "./ToolCallIndicator";
import { ChatMarkdown } from "./ChatMarkdown";
import { AdaptiveCardRenderer, parseAdaptiveCards } from "./AdaptiveCardRenderer";
import { ChatFormRenderer } from "./ChatFormRenderer";
import type { CardPayload } from "./ChatFormRenderer";
import { ShareMenu } from "../common/ShareMenu";
import { useChat } from "../../context/ChatContext";
import type { ShareableRoute } from "../../utils/shareLinks";
import { AgentBadge } from "./AgentBadge";
import { getAgentColor } from "./agentVisuals";

const useStyles = makeStyles({
  row: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    maxWidth: "92%",
  },
  rowUser: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  rowAssistant: {
    alignSelf: "flex-start",
  },
  avatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: "0",
    marginTop: "2px",
  },
  avatarUser: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  avatarAssistant: {
    backgroundColor: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground2,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    minWidth: "0",
  },
  bubble: {
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    borderRadius: tokens.borderRadiusLarge,
    wordBreak: "break-word",
    lineHeight: tokens.lineHeightBase400,
  },
  bubbleUser: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    borderBottomRightRadius: tokens.borderRadiusSmall,
  },
  bubbleAssistant: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
    borderBottomLeftRadius: tokens.borderRadiusSmall,
    boxShadow: tokens.shadow2,
  },
  cardContainer: {
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusLarge,
    borderBottomLeftRadius: tokens.borderRadiusSmall,
    boxShadow: tokens.shadow2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  timestamp: {
    ...shorthands.padding("0", tokens.spacingHorizontalXS),
    opacity: 0.6,
    transitionProperty: "opacity",
    transitionDuration: "150ms",
  },
  streaming: {
    animationName: {
      "0%": { opacity: 0.5 },
      "50%": { opacity: 1 },
      "100%": { opacity: 0.5 },
    },
    animationDuration: "1.5s",
    animationIterationCount: "infinite",
  },
  shareRow: {
    ...shorthands.padding(tokens.spacingVerticalXXS, "0"),
  },
});

function extractShareRoute(toolCalls: ToolCallInfo[]): ShareableRoute | null {
  const planCall = toolCalls.find(
    (tc) => tc.name === "plan_journey" && tc.status === "completed" && tc.result
  );
  if (!planCall) return null;

  try {
    const args = JSON.parse(planCall.arguments);
    return {
      origin: {
        lat: args.origin_lat,
        lng: args.origin_lng,
        label: args.origin_label || "Origin",
      },
      destination: {
        lat: args.destination_lat,
        lng: args.destination_lng,
        label: args.destination_label || "Destination",
      },
    };
  } catch {
    return null;
  }
}

/** Extract form cards from show_input_form tool calls */
function extractToolCards(toolCalls: ToolCallInfo[]): CardPayload[] {
  const cards: CardPayload[] = [];
  const formCalls = toolCalls.filter(
    (tc) => tc.name === "show_input_form" && (tc.status === "completed" || tc.status === "executing")
  );
  console.log("[ChatForm] Found show_input_form tool calls:", formCalls.length, "from total:", toolCalls.length);
  console.log("[ChatForm] All tool call names:", toolCalls.map((tc) => `${tc.name}(${tc.status})`).join(", "));
  for (const tc of formCalls) {
    try {
      console.log("[ChatForm] Parsing tool call arguments:", tc.arguments.slice(0, 300));
      const args = JSON.parse(tc.arguments);
      // Support both "card" (object) and legacy "card_json" (string) parameter names
      let cardObj = args.card ?? args.card_json;
      if (typeof cardObj === "string") {
        cardObj = JSON.parse(cardObj);
      }
      if (cardObj && (cardObj.type === "AdaptiveCard" || cardObj.body)) {
        console.log("[ChatForm] Valid card extracted with", (cardObj.body || []).length, "body elements");
        cards.push(cardObj as CardPayload);
      } else {
        console.warn("[ChatForm] Tool call card is not valid:", JSON.stringify(cardObj).slice(0, 200));
      }
    } catch (e) {
      console.error("[ChatForm] Failed to parse tool call arguments:", e, tc.arguments.slice(0, 200));
    }
  }
  return cards;
}

interface ChatMessageProps {
  message: ChatMessageType;
  showAgentHeader?: boolean;
}

export function ChatMessage({ message, showAgentHeader }: ChatMessageProps) {
  const styles = useStyles();
  const { sendMessage } = useChat();

  const isUser = message.role === "user";
  const rowClass = `${styles.row} ${isUser ? styles.rowUser : styles.rowAssistant}`;
  const avatarClass = `${styles.avatar} ${isUser ? styles.avatarUser : styles.avatarAssistant}`;
  const bubbleClass = `${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant} ${message.isStreaming && !message.content ? styles.streaming : ""}`;

  // Agent color for left border accent on assistant messages
  const agentColor = !isUser && message.agentDomain ? getAgentColor(message.agentDomain) : undefined;
  const bubbleBorderStyle: React.CSSProperties | undefined = agentColor
    ? { borderLeft: `3px solid ${agentColor}` }
    : undefined;

  const shareRoute = !isUser && message.toolCalls
    ? extractShareRoute(message.toolCalls)
    : null;

  // Extract adaptive cards from show_input_form tool calls (primary method)
  const toolCards = !isUser && message.toolCalls
    ? extractToolCards(message.toolCalls)
    : [];

  // Parse adaptive cards from text content (fallback method)
  const segments = !isUser && message.content
    ? parseAdaptiveCards(message.content)
    : null;
  const hasTextCards = segments?.some((s) => s.type === "card");

  // Filter out show_input_form from displayed tool calls (card is rendered separately)
  const displayToolCalls = message.toolCalls?.filter(
    (tc) => tc.name !== "show_input_form"
  );

  const handleCardAction = (data: Record<string, unknown>) => {
    // Send the card submission data back as a user message
    const summary = Object.entries(data)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    sendMessage(summary);
  };

  return (
    <div className={rowClass}>
      <div className={avatarClass}>
        {isUser ? <Person20Regular /> : <Bot20Regular />}
      </div>
      <div className={styles.content}>
        {/* Agent badge header — only when agent changes */}
        {!isUser && showAgentHeader && message.agentDomain && (
          <AgentBadge
            domain={message.agentDomain}
            displayName={message.agentDisplayName}
            toolCount={displayToolCalls?.length || 0}
          />
        )}
        {/* Text bubble */}
        {(message.content || message.isStreaming) && (
          <div className={bubbleClass} style={bubbleBorderStyle}>
            {message.isStreaming && !message.content ? (
              <Text size={300} italic>
                Thinking...
              </Text>
            ) : isUser ? (
              <Text size={400}>{message.content}</Text>
            ) : hasTextCards && segments ? (
              segments.map((seg, i) =>
                seg.type === "text" ? (
                  <ChatMarkdown key={i} content={seg.content} />
                ) : (
                  <AdaptiveCardRenderer
                    key={i}
                    card={seg.card}
                    onAction={handleCardAction}
                  />
                )
              )
            ) : (
              <ChatMarkdown content={message.content} />
            )}
          </div>
        )}
        {/* Form cards from tool calls (native Fluent UI) */}
        {toolCards.map((card, i) => (
          <div key={`tool-card-${i}`} className={styles.cardContainer}>
            <ChatFormRenderer card={card} onSubmit={handleCardAction} />
          </div>
        ))}
        {displayToolCalls && displayToolCalls.length > 0 && (
          <ToolCallIndicator toolCalls={displayToolCalls} agentColor={agentColor} />
        )}
        {shareRoute && (
          <div className={styles.shareRow}>
            <ShareMenu route={shareRoute} size="small" appearance="subtle" />
          </div>
        )}
        <Text
          size={100}
          className={styles.timestamp}
        >
          {formatTime(message.timestamp)}
        </Text>
      </div>
    </div>
  );
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
