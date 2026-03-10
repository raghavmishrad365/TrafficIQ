import React, { useState } from "react";
import {
  Card,
  Switch,
  Input,
  Button,
  Text,
  Badge,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
  Label,
  shorthands,
} from "@fluentui/react-components";
import { emailService } from "../../services/emailService";

export interface EmailAlertSetupProps {
  enabled: boolean;
  emailAddress?: string;
  onToggle: (enabled: boolean) => void;
  onEmailChange: (email: string) => void;
}

const useStyles = makeStyles({
  card: {
    ...shorthands.padding(tokens.spacingVerticalL),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusXLarge,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
  },
});

export const EmailAlertSetup: React.FC<EmailAlertSetupProps> = ({
  enabled,
  emailAddress = "",
  onToggle,
  onEmailChange,
}) => {
  const styles = useStyles();
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleSendTest = async () => {
    if (!emailAddress) {
      setStatusMessage("Please enter an email address first.");
      return;
    }

    setSending(true);
    setStatusMessage("");

    try {
      await emailService.sendEmailNotification(
        emailAddress,
        "TrafficInfo Test Notification",
        "This is a test email from TrafficInfo. If you received this, email alerts are configured correctly."
      );
      setStatusMessage("Test email sent successfully!");
    } catch (error) {
      setStatusMessage(
        `Failed to send test email: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Text weight="semibold" size={400}>
            Email Alerts
          </Text>
          <Badge
            appearance="filled"
            color={enabled ? "success" : "informative"}
            size="small"
          >
            {enabled ? "Active" : "Inactive"}
          </Badge>
        </div>
        <Switch
          checked={enabled}
          onChange={(_e, data) => onToggle(data.checked)}
          label={enabled ? "On" : "Off"}
        />
      </div>

      <div className={styles.field}>
        <Label htmlFor="email-alert-address">Email Address</Label>
        <Input
          id="email-alert-address"
          type="email"
          placeholder="you@example.com"
          value={emailAddress}
          onChange={(_e, data) => onEmailChange(data.value)}
          disabled={!enabled}
        />
      </div>

      <div className={styles.actions}>
        <Button
          appearance="secondary"
          onClick={handleSendTest}
          disabled={!enabled || sending || !emailAddress}
        >
          {sending ? "Sending..." : "Send Test Email"}
        </Button>
      </div>

      {statusMessage && (
        <MessageBar
          intent={statusMessage.startsWith("Failed") ? "error" : "success"}
        >
          <MessageBarBody>{statusMessage}</MessageBarBody>
        </MessageBar>
      )}
    </Card>
  );
};

export default EmailAlertSetup;
