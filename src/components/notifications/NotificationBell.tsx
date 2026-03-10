import React from "react";
import {
  ToolbarButton,
  CounterBadge,
  makeStyles,
} from "@fluentui/react-components";
import { Alert24Regular } from "@fluentui/react-icons";

export interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

const useStyles = makeStyles({
  wrapper: {
    position: "relative",
    display: "inline-flex",
  },
  badge: {
    position: "absolute",
    top: "2px",
    right: "2px",
  },
});

export const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount,
  onClick,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.wrapper}>
      <ToolbarButton
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} unread)`
            : "Notifications"
        }
        icon={<Alert24Regular />}
        onClick={onClick}
      />
      {unreadCount > 0 && (
        <CounterBadge
          className={styles.badge}
          count={unreadCount}
          size="small"
          color="danger"
        />
      )}
    </div>
  );
};

export default NotificationBell;
