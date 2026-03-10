import {
  makeStyles,
  tokens,
  Button,
  Tooltip,
} from "@fluentui/react-components";
import {
  PanelRight20Regular,
  PanelLeft20Regular,
  PanelSeparateWindow20Regular,
  ArrowMaximize20Regular,
  ArrowMinimize20Regular,
} from "@fluentui/react-icons";
import type { ChatLayoutMode } from "../../types/chat";

const useStyles = makeStyles({
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
  },
  active: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
});

const MODES: { mode: ChatLayoutMode; icon: React.ElementType; label: string }[] = [
  { mode: "docked-right", icon: PanelRight20Regular, label: "Dock Right" },
  { mode: "docked-left", icon: PanelLeft20Regular, label: "Dock Left" },
  { mode: "floating", icon: PanelSeparateWindow20Regular, label: "Float" },
  { mode: "expanded", icon: ArrowMaximize20Regular, label: "Expand" },
  { mode: "minimized", icon: ArrowMinimize20Regular, label: "Minimize" },
];

interface ChatPanelToolbarProps {
  currentMode: ChatLayoutMode;
  onModeChange: (mode: ChatLayoutMode) => void;
}

export function ChatPanelToolbar({ currentMode, onModeChange }: ChatPanelToolbarProps) {
  const styles = useStyles();

  return (
    <div className={styles.toolbar}>
      {MODES.map(({ mode, icon: Icon, label }) => (
        <Tooltip key={mode} content={label} relationship="label">
          <Button
            appearance="subtle"
            size="small"
            icon={<Icon />}
            className={currentMode === mode ? styles.active : undefined}
            onClick={() => onModeChange(mode)}
            aria-label={label}
            aria-pressed={currentMode === mode}
          />
        </Tooltip>
      ))}
    </div>
  );
}
