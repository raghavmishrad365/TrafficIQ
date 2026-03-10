import React from "react";
import {
  Text,
  Button,
  makeStyles,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import { Alert24Regular } from "@fluentui/react-icons";
import type { AppNotification } from "../../types/notification";
import { NotificationItem } from "./NotificationItem";
import { EmptyState } from "../common/EmptyState";

export interface NotificationPanelProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

const useStyles = makeStyles({
  panel: {
    display: "flex",
    flexDirection: "column",
    maxHeight: "480px",
    width: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    ...shorthands.padding(tokens.spacingVerticalM),
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  list: {
    overflowY: "auto",
    ...shorthands.padding(tokens.spacingVerticalS),
    flex: 1,
  },
});

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onMarkRead,
  onClearAll,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Text weight="semibold" size={400}>
          Notifications
        </Text>
        {notifications.length > 0 && (
          <Button appearance="subtle" size="small" onClick={onClearAll}>
            Clear all
          </Button>
        )}
      </div>
      <div className={styles.list}>
        {notifications.length === 0 ? (
          <EmptyState
            icon={<Alert24Regular />}
            title="No notifications"
            description="You're all caught up. Traffic alerts and journey updates will appear here."
          />
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={onMarkRead}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
