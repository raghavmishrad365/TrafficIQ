import { useState } from "react";
import {
  makeStyles,
  tokens,
  Text,
  TabList,
  Tab,
  Card,
  CardHeader,
  Switch,
  Button,
  shorthands,
} from "@fluentui/react-components";
import { NotificationPanel } from "../components/notifications/NotificationPanel";
import { MorningAlertSetup } from "../components/notifications/MorningAlertSetup";
import { EmailAlertSetup } from "../components/notifications/EmailAlertSetup";
import { useNotificationContext } from "../context/NotificationContext";
import {
  registerServiceWorker,
  subscribeToPush,
  checkPermission,
} from "../services/notificationService";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  pageHeader: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    borderTop: "3px solid",
    borderImage: `linear-gradient(90deg, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundPressed}) 1`,
    ...shorthands.padding(tokens.spacingVerticalM, "0"),
  },
  tabList: {
    borderBottomWidth: "2px",
    borderBottomStyle: "solid",
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  card: {
    borderRadius: tokens.borderRadiusXLarge,
  },
  pushSection: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    ...shorthands.padding(tokens.spacingVerticalM),
  },
});

export function NotificationsPage() {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState("recent");
  const {
    notifications,
    markRead,
    clearAll,
    preferences,
    updatePreferences,
  } = useNotificationContext();
  const [pushStatus, setPushStatus] = useState(checkPermission());

  const handleEnablePush = async () => {
    const reg = await registerServiceWorker();
    if (reg) {
      const sub = await subscribeToPush(reg);
      if (sub) {
        setPushStatus("granted");
        updatePreferences({ ...preferences, pushEnabled: true });
      }
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <Text size={600} weight="semibold">
          Notifications
        </Text>
        <Text size={200}>View alerts and manage notification preferences</Text>
      </div>
      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_, data) => setSelectedTab(data.value as string)}
        className={styles.tabList}
      >
        <Tab value="recent">Recent</Tab>
        <Tab value="settings">Settings</Tab>
      </TabList>
      <div className={styles.content}>
        {selectedTab === "recent" ? (
          <NotificationPanel
            notifications={notifications}
            onMarkRead={markRead}
            onClearAll={clearAll}
          />
        ) : (
          <>
            <Card className={styles.card}>
              <CardHeader
                header={<Text weight="semibold">Push Notifications</Text>}
                description="Browser push notifications for traffic alerts"
              />
              <div className={styles.pushSection}>
                {pushStatus === "granted" ? (
                  <Switch
                    label="Push notifications enabled"
                    checked={preferences.pushEnabled}
                    onChange={(_, data) =>
                      updatePreferences({
                        ...preferences,
                        pushEnabled: data.checked,
                      })
                    }
                  />
                ) : (
                  <Button appearance="primary" onClick={handleEnablePush}>
                    Enable Push Notifications
                  </Button>
                )}
              </div>
            </Card>
            <MorningAlertSetup config={null} onChange={() => {}} />
            <EmailAlertSetup
              enabled={preferences.emailEnabled}
              emailAddress={preferences.emailAddress}
              onToggle={(enabled) =>
                updatePreferences({ ...preferences, emailEnabled: enabled })
              }
              onEmailChange={(email) =>
                updatePreferences({ ...preferences, emailAddress: email })
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
