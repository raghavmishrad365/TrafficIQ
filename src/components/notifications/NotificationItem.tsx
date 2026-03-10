import React from "react";
import {
  Card,
  Text,
  makeStyles,
  tokens,
  mergeClasses,
  shorthands,
} from "@fluentui/react-components";
import {
  Info24Regular,
  Warning24Regular,
  ErrorCircle24Regular,
  CheckmarkCircle24Regular,
} from "@fluentui/react-icons";
import type { AppNotification } from "../../types/notification";
import { formatRelativeTime } from "../../utils/formatters";

export interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
}

const useStyles = makeStyles({
  card: {
    cursor: "pointer",
    marginBottom: tokens.spacingVerticalXS,
    ...shorthands.padding(tokens.spacingVerticalS),
    borderRadius: tokens.borderRadiusLarge,
    transitionProperty: "background-color, box-shadow",
    transitionDuration: "150ms",
    ":hover": {
      backgroundColor: tokens.colorBrandBackground2,
      boxShadow: tokens.shadow2,
    },
  },
  unread: {
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: tokens.colorBrandBackground,
    backgroundColor: tokens.colorNeutralBackground1Hover,
  },
  read: {
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: "transparent",
  },
  content: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
  },
  icon: {
    flexShrink: 0,
    paddingTop: "2px",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    minWidth: 0,
    flex: 1,
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
  },
  timestamp: {
    color: tokens.colorNeutralForeground3,
  },
});

function getSeverityIcon(severity?: AppNotification["severity"]) {
  switch (severity) {
    case "warning":
      return <Warning24Regular primaryFill={tokens.colorPaletteYellowForeground1} />;
    case "error":
      return <ErrorCircle24Regular primaryFill={tokens.colorPaletteRedForeground1} />;
    case "success":
      return <CheckmarkCircle24Regular primaryFill={tokens.colorPaletteGreenForeground1} />;
    case "info":
    default:
      return <Info24Regular primaryFill={tokens.colorBrandForeground1} />;
  }
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
}) => {
  const styles = useStyles();

  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
  };

  return (
    <Card
      className={mergeClasses(
        styles.card,
        notification.read ? styles.read : styles.unread
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className={styles.content}>
        <span className={styles.icon}>
          {getSeverityIcon(notification.severity)}
        </span>
        <div className={styles.body}>
          <Text className={styles.title} size={300}>
            {notification.title}
          </Text>
          <Text size={200}>{notification.body}</Text>
          <Text className={styles.timestamp} size={100}>
            {formatRelativeTime(notification.timestamp)}
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default NotificationItem;
