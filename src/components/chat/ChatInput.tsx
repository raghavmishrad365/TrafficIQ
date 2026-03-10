import { useState, useCallback, useRef, useEffect } from "react";
import {
  makeStyles,
  tokens,
  Button,
  shorthands,
} from "@fluentui/react-components";
import { Send20Filled } from "@fluentui/react-icons";

const useStyles = makeStyles({
  container: {
    display: "flex",
    alignItems: "flex-end",
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  inputWrapper: {
    display: "flex",
    alignItems: "flex-end",
    gap: tokens.spacingHorizontalS,
    flexGrow: 1,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    transitionProperty: "border-color, box-shadow",
    transitionDuration: "150ms",
    ":focus-within": {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      boxShadow: `0 0 0 1px ${tokens.colorBrandStroke1}`,
    },
  },
  textarea: {
    flexGrow: 1,
    ...shorthands.border("none"),
    backgroundColor: "transparent",
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase400,
    lineHeight: tokens.lineHeightBase400,
    fontFamily: "inherit",
    resize: "none",
    ...shorthands.outline("none"),
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalXS),
    maxHeight: "120px",
    minHeight: "24px",
    "::placeholder": {
      color: tokens.colorNeutralForeground4,
    },
  },
  sendButton: {
    flexShrink: "0",
    width: "36px",
    height: "36px",
    minWidth: "36px",
    borderRadius: "50%",
    ...shorthands.padding("0"),
  },
});

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const styles = useStyles();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue("");
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [value]);

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="Message TRAFI..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        <Button
          appearance="primary"
          icon={<Send20Filled />}
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className={styles.sendButton}
          shape="circular"
        />
      </div>
    </div>
  );
}
