import React from "react";
import {
  Card,
  Switch,
  Checkbox,
  Input,
  Text,
  Badge,
  makeStyles,
  tokens,
  Label,
  shorthands,
} from "@fluentui/react-components";
import type { MorningAlertConfig } from "../../types/journey";
import { DAY_NAMES } from "../../utils/constants";

export interface MorningAlertSetupProps {
  config: MorningAlertConfig | null;
  onChange: (config: MorningAlertConfig | null) => void;
}

const DEFAULT_CONFIG: MorningAlertConfig = {
  enabled: true,
  time: "07:00",
  daysOfWeek: [1, 2, 3, 4, 5],
  emailEnabled: false,
  pushEnabled: true,
};

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
  daysRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

export const MorningAlertSetup: React.FC<MorningAlertSetupProps> = ({
  config,
  onChange,
}) => {
  const styles = useStyles();
  const isEnabled = config?.enabled ?? false;

  const handleToggleEnabled = (checked: boolean) => {
    if (checked) {
      onChange(config ? { ...config, enabled: true } : { ...DEFAULT_CONFIG });
    } else {
      onChange(config ? { ...config, enabled: false } : null);
    }
  };

  const handleTimeChange = (value: string) => {
    if (config) {
      onChange({ ...config, time: value });
    }
  };

  const handleDayToggle = (dayIndex: number, checked: boolean) => {
    if (!config) return;
    const days = checked
      ? [...config.daysOfWeek, dayIndex].sort()
      : config.daysOfWeek.filter((d) => d !== dayIndex);
    onChange({ ...config, daysOfWeek: days });
  };

  const handlePushToggle = (checked: boolean) => {
    if (config) {
      onChange({ ...config, pushEnabled: checked });
    }
  };

  const handleEmailToggle = (checked: boolean) => {
    if (config) {
      onChange({ ...config, emailEnabled: checked });
    }
  };

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Text weight="semibold" size={400}>
            Morning Alert
          </Text>
          <Badge
            appearance="filled"
            color={isEnabled ? "success" : "informative"}
            size="small"
          >
            {isEnabled ? "Active" : "Inactive"}
          </Badge>
        </div>
        <Switch
          checked={isEnabled}
          onChange={(_e, data) => handleToggleEnabled(data.checked)}
          label={isEnabled ? "On" : "Off"}
        />
      </div>

      <div className={styles.field}>
        <Label htmlFor="morning-alert-time">Alert Time</Label>
        <Input
          id="morning-alert-time"
          type="time"
          value={config?.time ?? DEFAULT_CONFIG.time}
          onChange={(_e, data) => handleTimeChange(data.value)}
          disabled={!isEnabled}
        />
      </div>

      <div className={styles.field}>
        <Label>Days of Week</Label>
        <div className={styles.daysRow}>
          {DAY_NAMES.map((dayName, index) => (
            <Checkbox
              key={dayName}
              label={dayName}
              checked={config?.daysOfWeek.includes(index) ?? (index >= 1 && index <= 5)}
              onChange={(_e, data) =>
                handleDayToggle(index, data.checked as boolean)
              }
              disabled={!isEnabled}
            />
          ))}
        </div>
      </div>

      <div className={styles.toggleRow}>
        <Label>Push Notifications</Label>
        <Switch
          checked={config?.pushEnabled ?? DEFAULT_CONFIG.pushEnabled}
          onChange={(_e, data) => handlePushToggle(data.checked)}
          disabled={!isEnabled}
        />
      </div>

      <div className={styles.toggleRow}>
        <Label>Email Notifications</Label>
        <Switch
          checked={config?.emailEnabled ?? DEFAULT_CONFIG.emailEnabled}
          onChange={(_e, data) => handleEmailToggle(data.checked)}
          disabled={!isEnabled}
        />
      </div>
    </Card>
  );
};

export default MorningAlertSetup;
