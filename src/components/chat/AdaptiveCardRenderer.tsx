import { useRef, useEffect, useCallback } from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import * as AdaptiveCards from "adaptivecards";

const useStyles = makeStyles({
  container: {
    borderRadius: tokens.borderRadiusLarge,
    overflow: "hidden",
    "& .ac-container": {
      backgroundColor: "transparent !important",
    },
    "& .ac-textBlock": {
      color: `${tokens.colorNeutralForeground1} !important`,
      fontFamily: `${tokens.fontFamilyBase} !important`,
    },
    "& .ac-input": {
      borderRadius: tokens.borderRadiusMedium,
      border: `1px solid ${tokens.colorNeutralStroke1}`,
      backgroundColor: tokens.colorNeutralBackground1,
      color: tokens.colorNeutralForeground1,
      fontFamily: tokens.fontFamilyBase,
      fontSize: tokens.fontSizeBase300,
      padding: "6px 8px",
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
    },
    "& .ac-input:focus": {
      borderColor: tokens.colorBrandStroke1 as unknown as undefined,
      boxShadow: `0 0 0 1px ${tokens.colorBrandStroke1}`,
    },
    "& .ac-pushButton": {
      borderRadius: tokens.borderRadiusMedium,
      padding: "8px 16px",
      fontFamily: tokens.fontFamilyBase,
      fontSize: tokens.fontSizeBase300,
      fontWeight: tokens.fontWeightSemibold as unknown as string,
      cursor: "pointer",
      border: "none",
      transition: "background 150ms ease",
    },
    "& .ac-pushButton.style-default": {
      backgroundColor: tokens.colorNeutralBackground3,
      color: tokens.colorNeutralForeground1,
    },
    "& .ac-pushButton.style-default:hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
    "& .ac-pushButton.style-positive": {
      backgroundColor: tokens.colorBrandBackground,
      color: tokens.colorNeutralForegroundOnBrand,
    },
    "& .ac-pushButton.style-positive:hover": {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
    "& .ac-pushButton.style-destructive": {
      backgroundColor: tokens.colorPaletteRedBackground3,
      color: tokens.colorNeutralForegroundOnBrand,
    },
    "& .ac-choiceSetInput-expanded": {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    "& .ac-choiceSetInput-compact": {
      borderRadius: tokens.borderRadiusMedium,
      border: `1px solid ${tokens.colorNeutralStroke1}`,
      backgroundColor: tokens.colorNeutralBackground1,
      color: tokens.colorNeutralForeground1,
      fontFamily: tokens.fontFamilyBase,
      fontSize: tokens.fontSizeBase300,
      padding: "6px 8px",
    },
    "& label": {
      color: tokens.colorNeutralForeground1,
      fontFamily: tokens.fontFamilyBase,
      fontSize: tokens.fontSizeBase200,
      fontWeight: tokens.fontWeightSemibold as unknown as string,
    },
    "& .ac-horizontal-separator": {
      borderTopColor: tokens.colorNeutralStroke2,
    },
    "& .ac-actionSet": {
      display: "flex",
      gap: "8px",
      marginTop: "8px",
    },
  },
});

export interface AdaptiveCardPayload {
  type: "AdaptiveCard";
  $schema?: string;
  version?: string;
  body?: unknown[];
  actions?: unknown[];
  [key: string]: unknown;
}

interface AdaptiveCardRendererProps {
  card: AdaptiveCardPayload;
  onAction?: (data: Record<string, unknown>) => void;
}

export function AdaptiveCardRenderer({ card, onAction }: AdaptiveCardRendererProps) {
  const styles = useStyles();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardInstanceRef = useRef<AdaptiveCards.AdaptiveCard | null>(null);

  const handleAction = useCallback(
    (action: AdaptiveCards.Action) => {
      if (action instanceof AdaptiveCards.SubmitAction && onAction) {
        onAction((action.data as Record<string, unknown>) ?? {});
      }
      if (action instanceof AdaptiveCards.OpenUrlAction && action.url) {
        window.open(action.url, "_blank", "noopener,noreferrer");
      }
    },
    [onAction]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    console.log("[AdaptiveCard] Rendering card:", JSON.stringify(card).slice(0, 200));

    const adaptiveCard = new AdaptiveCards.AdaptiveCard();

    // Configure host config for compact chat appearance
    adaptiveCard.hostConfig = new AdaptiveCards.HostConfig({
      fontFamily: "var(--fontFamilyBase)",
      containerStyles: {
        default: {
          backgroundColor: "transparent",
          foregroundColors: {
            default: { default: "var(--colorNeutralForeground1)", subtle: "var(--colorNeutralForeground3)" },
            accent: { default: "var(--colorBrandForeground1)", subtle: "var(--colorBrandForeground2)" },
            attention: { default: "var(--colorPaletteRedForeground1)", subtle: "var(--colorPaletteRedForeground2)" },
            good: { default: "var(--colorPaletteGreenForeground1)", subtle: "var(--colorPaletteGreenForeground2)" },
            warning: { default: "var(--colorPaletteYellowForeground1)", subtle: "var(--colorPaletteYellowForeground2)" },
          },
        },
      },
      actions: {
        actionsOrientation: "horizontal",
        actionAlignment: "stretch",
        buttonSpacing: 8,
        maxActions: 5,
        spacing: "default",
      },
      spacing: {
        small: 4,
        default: 8,
        medium: 12,
        large: 16,
        extraLarge: 24,
        padding: 12,
      },
    });

    adaptiveCard.onExecuteAction = handleAction;

    try {
      adaptiveCard.parse(card);
      const renderedCard = adaptiveCard.render();
      if (renderedCard && containerRef.current) {
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(renderedCard);
        cardInstanceRef.current = adaptiveCard;
        console.log("[AdaptiveCard] Card rendered successfully");
      } else {
        console.warn("[AdaptiveCard] render() returned null");
        if (containerRef.current) {
          containerRef.current.textContent = "Card could not be rendered.";
        }
      }
    } catch (e) {
      console.error("[AdaptiveCard] Failed to render:", e, card);
      if (containerRef.current) {
        containerRef.current.textContent = "Failed to render card.";
      }
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      cardInstanceRef.current = null;
    };
  }, [card, handleAction]);

  return <div ref={containerRef} className={styles.container} />;
}

/**
 * Parse a message content string to extract text segments and adaptive card blocks.
 *
 * Card blocks are delimited by :::adaptive-card ... ::: markers.
 * Returns an array of segments, each either { type: "text", content } or { type: "card", card }.
 */
export type MessageSegment =
  | { type: "text"; content: string }
  | { type: "card"; card: AdaptiveCardPayload };

export function parseAdaptiveCards(content: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  // Flexible pattern: handle \r\n, optional whitespace around delimiters, and
  // also handle cases where the model wraps it in a code fence
  const cardPattern = /:::adaptive-card\s*\r?\n([\s\S]*?)\r?\n\s*:::/g;
  // Also try to detect JSON blocks that look like adaptive cards without the delimiter
  // (fallback for when the model forgets the delimiter but outputs raw JSON)
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let foundCards = false;

  while ((match = cardPattern.exec(content)) !== null) {
    foundCards = true;
    // Text before the card
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) segments.push({ type: "text", content: text });
    }

    // Try to parse the card JSON
    try {
      const cardJson = JSON.parse(match[1]) as AdaptiveCardPayload;
      if (cardJson.type === "AdaptiveCard") {
        segments.push({ type: "card", card: cardJson });
      } else {
        // Not a valid card, treat as text
        segments.push({ type: "text", content: match[0] });
      }
    } catch {
      // Invalid JSON, treat as text
      segments.push({ type: "text", content: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Fallback: if no :::adaptive-card::: blocks found, check for JSON code blocks
  // that contain AdaptiveCard payloads (model might use ```json ... ``` instead)
  if (!foundCards) {
    const codeBlockPattern = /```(?:json)?\s*\r?\n(\{[\s\S]*?"type"\s*:\s*"AdaptiveCard"[\s\S]*?\})\r?\n\s*```/g;
    let codeMatch: RegExpExecArray | null;

    while ((codeMatch = codeBlockPattern.exec(content)) !== null) {
      foundCards = true;
      if (codeMatch.index > lastIndex) {
        const text = content.slice(lastIndex, codeMatch.index).trim();
        if (text) segments.push({ type: "text", content: text });
      }

      try {
        const cardJson = JSON.parse(codeMatch[1]) as AdaptiveCardPayload;
        if (cardJson.type === "AdaptiveCard") {
          segments.push({ type: "card", card: cardJson });
        } else {
          segments.push({ type: "text", content: codeMatch[0] });
        }
      } catch {
        segments.push({ type: "text", content: codeMatch[0] });
      }

      lastIndex = codeMatch.index + codeMatch[0].length;
    }
  }

  // Remaining text after last card
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) segments.push({ type: "text", content: text });
  }

  // If no cards found, return the whole content as text
  if (segments.length === 0 && content.trim()) {
    segments.push({ type: "text", content });
  }

  return segments;
}
