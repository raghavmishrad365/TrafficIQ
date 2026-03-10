import { useState } from "react";
import {
  makeStyles,
  tokens,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Label,
  Switch,
  Checkbox,
  Text,
} from "@fluentui/react-components";
import type { Location, MorningAlertConfig } from "../../types/journey";
import { DAY_NAMES } from "../../utils/constants";

const useStyles = makeStyles({
  content: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  route: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  alertSection: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalS,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  daysRow: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap" as const,
  },
});

interface SaveJourneyDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, morningAlert: MorningAlertConfig | null) => void;
  origin: Location;
  destination: Location;
}

export function SaveJourneyDialog({
  open,
  onClose,
  onSave,
  origin,
  destination,
}: SaveJourneyDialogProps) {
  const styles = useStyles();
  const [name, setName] = useState(
    `${origin.label} to ${destination.label}`
  );
  const [enableAlert, setEnableAlert] = useState(false);
  const [alertTime, setAlertTime] = useState("07:00");
  const [alertDays, setAlertDays] = useState([1, 2, 3, 4, 5]);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const toggleDay = (day: number) => {
    setAlertDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    const morningAlert: MorningAlertConfig | null = enableAlert
      ? {
          enabled: true,
          time: alertTime,
          daysOfWeek: alertDays,
          pushEnabled,
          emailEnabled,
        }
      : null;
    onSave(name, morningAlert);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Save Journey</DialogTitle>
          <DialogContent className={styles.content}>
            <div className={styles.route}>
              <Text size={200}>From: {origin.label}</Text>
              <Text size={200}>To: {destination.label}</Text>
            </div>
            <div>
              <Label htmlFor="journey-name">Journey Name</Label>
              <Input
                id="journey-name"
                value={name}
                onChange={(_, data) => setName(data.value)}
                style={{ width: "100%" }}
              />
            </div>
            <div className={styles.alertSection}>
              <Switch
                label="Enable morning alert"
                checked={enableAlert}
                onChange={(_, data) => setEnableAlert(data.checked)}
              />
              {enableAlert && (
                <>
                  <div>
                    <Label htmlFor="alert-time">Alert Time</Label>
                    <Input
                      id="alert-time"
                      type="time"
                      value={alertTime}
                      onChange={(_, data) => setAlertTime(data.value)}
                    />
                  </div>
                  <div>
                    <Label>Days</Label>
                    <div className={styles.daysRow}>
                      {DAY_NAMES.map((day, index) => (
                        <Checkbox
                          key={day}
                          label={day}
                          checked={alertDays.includes(index)}
                          onChange={() => toggleDay(index)}
                        />
                      ))}
                    </div>
                  </div>
                  <Switch
                    label="Push notification"
                    checked={pushEnabled}
                    onChange={(_, data) => setPushEnabled(data.checked)}
                  />
                  <Switch
                    label="Email notification"
                    checked={emailEnabled}
                    onChange={(_, data) => setEmailEnabled(data.checked)}
                  />
                </>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" onClick={onClose}>
                Cancel
              </Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              onClick={handleSave}
              disabled={!name.trim()}
            >
              Save Journey
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
