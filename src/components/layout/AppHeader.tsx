import {
  makeStyles,
  tokens,
  Text,
  Button,
  shorthands,
} from "@fluentui/react-components";
import {
  Navigation24Regular,
  Chat28Regular,
  Alert28Regular,
  VehicleTruckProfile24Filled,
  WeatherSunny28Regular,
  WeatherMoon28Regular,
} from "@fluentui/react-icons";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../config/routes";
import { useChat } from "../../context/ChatContext";
import { useTheme } from "../../context/ThemeContext";

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalL),
    background: `linear-gradient(135deg, var(--header-gradient-start), var(--header-gradient-end))`,
    minHeight: "48px",
    boxShadow: tokens.shadow4,
    position: "relative",
    zIndex: 10,
  },
  headerDark: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalL),
    background: `linear-gradient(135deg, var(--header-gradient-start), var(--header-gradient-end))`,
    minHeight: "48px",
    boxShadow: tokens.shadow4,
    position: "relative",
    zIndex: 10,
    borderBottom: `2px solid ${tokens.colorBrandBackground}`,
  },
  titleSection: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  menuButton: {
    color: "var(--header-text)",
    ":hover": {
      color: "var(--header-text)",
      backgroundColor: "var(--header-button-hover)",
    },
  },
  appIcon: {
    width: "32px",
    height: "32px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: "var(--header-button-hover)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--header-text)",
  },
  titleGroup: {
    display: "flex",
    alignItems: "baseline",
    gap: tokens.spacingHorizontalXXS,
  },
  title: {
    color: "var(--header-text)",
    fontWeight: tokens.fontWeightBold,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    color: "var(--header-text-secondary)",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  actionButton: {
    color: "var(--header-text)",
    borderRadius: "50%",
    ":hover": {
      color: "var(--header-text)",
      backgroundColor: "var(--header-button-hover)",
    },
  },
  chatButton: {
    color: "var(--header-text)",
    borderRadius: "50%",
    position: "relative",
    ":hover": {
      color: "var(--header-text)",
      backgroundColor: "var(--header-button-hover)",
    },
    "::after": {
      content: '""',
      position: "absolute",
      top: "2px",
      right: "2px",
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      backgroundColor: tokens.colorPaletteGreenBackground3,
      boxShadow: `0 0 0 2px var(--header-gradient-start)`,
    },
  },
});

interface AppHeaderProps {
  onMenuToggle?: () => void;
}

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const styles = useStyles();
  const navigate = useNavigate();
  const { toggleChat } = useChat();
  const { resolvedTheme, setThemeMode } = useTheme();

  return (
    <header className={resolvedTheme === "dark" ? styles.headerDark : styles.header}>
      <div className={styles.titleSection}>
        {onMenuToggle && (
          <Button
            appearance="transparent"
            icon={<Navigation24Regular />}
            onClick={onMenuToggle}
            aria-label="Toggle navigation"
            className={styles.menuButton}
            size="small"
          />
        )}
        <div className={styles.appIcon}>
          <VehicleTruckProfile24Filled />
        </div>
        <div className={styles.titleGroup}>
          <Text size={500} className={styles.title}>
            TrafficIQ
          </Text>
          <Text size={200} className={styles.subtitle}>
            Supply Chain Intelligence
          </Text>
        </div>
      </div>
      <div className={styles.actions}>
        <Button
          appearance="transparent"
          icon={<Chat28Regular />}
          onClick={toggleChat}
          aria-label="Open TRAFI assistant"
          className={styles.chatButton}
        />
        <Button
          appearance="transparent"
          icon={
            resolvedTheme === "dark" ? (
              <WeatherSunny28Regular />
            ) : (
              <WeatherMoon28Regular />
            )
          }
          onClick={() =>
            setThemeMode(resolvedTheme === "dark" ? "light" : "dark")
          }
          aria-label="Toggle theme"
          className={styles.actionButton}
        />
        <Button
          appearance="transparent"
          icon={<Alert28Regular />}
          onClick={() => navigate(ROUTES.NOTIFICATIONS)}
          aria-label="Notifications"
          className={styles.actionButton}
        />
      </div>
    </header>
  );
}
