import { useState, useEffect } from "react";
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Button,
  Input,
  Label,
  RadioGroup,
  Radio,
  Checkbox,
  Text,
  Spinner,
  Divider,
  shorthands,
} from "@fluentui/react-components";
import { VehicleCar24Regular } from "@fluentui/react-icons";
import { LocationSearch } from "../map/LocationSearch";
import type { Location, JourneyPreferences, TransportMode } from "../../types/journey";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    boxShadow: tokens.shadow2,
    borderRadius: tokens.borderRadiusXLarge,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  locationRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
  },
  dot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    flexShrink: 0,
    marginTop: "28px",
  },
  originDot: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
    boxShadow: `0 0 0 2px ${tokens.colorPaletteGreenBorder1}`,
  },
  destDot: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    boxShadow: `0 0 0 2px ${tokens.colorPaletteRedBorder1}`,
  },
  locationInput: {
    flex: 1,
  },
  row: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    alignItems: "center",
  },
  checkboxGroup: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
  },
  submitButton: {
    ...shorthands.padding(tokens.spacingVerticalS),
    background: "linear-gradient(135deg, " + tokens.colorBrandBackground + ", " + tokens.colorBrandBackgroundPressed + ")",
    color: tokens.colorNeutralForegroundOnBrand,
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: tokens.fontWeightSemibold,
    ":hover": {
      background: "linear-gradient(135deg, " + tokens.colorBrandBackgroundHover + ", " + tokens.colorBrandBackground + ")",
    },
  },
});

interface JourneyFormProps {
  onSubmit: (
    origin: Location,
    destination: Location,
    departureTime: string | undefined,
    preferences: JourneyPreferences
  ) => void;
  isLoading?: boolean;
  initialOrigin?: Location | null;
  initialDestination?: Location | null;
}

export function JourneyForm({ onSubmit, isLoading, initialOrigin, initialDestination }: JourneyFormProps) {
  const styles = useStyles();
  const [originText, setOriginText] = useState(initialOrigin?.label ?? "");
  const [destText, setDestText] = useState(initialDestination?.label ?? "");
  const [originLocation, setOriginLocation] = useState<Location | null>(initialOrigin ?? null);
  const [destLocation, setDestLocation] = useState<Location | null>(initialDestination ?? null);

  // Sync form state when initial props change (e.g. navigating from Saved Journeys)
  useEffect(() => {
    if (initialOrigin) {
      setOriginText(initialOrigin.label);
      setOriginLocation(initialOrigin);
    }
  }, [initialOrigin]);

  useEffect(() => {
    if (initialDestination) {
      setDestText(initialDestination.label);
      setDestLocation(initialDestination);
    }
  }, [initialDestination]);

  const [departureTime, setDepartureTime] = useState("");
  const [transportMode, setTransportMode] = useState<TransportMode>("car");
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);

  const canSubmit = originLocation && destLocation && !isLoading;

  const handleSubmit = () => {
    if (!originLocation || !destLocation) return;
    onSubmit(originLocation, destLocation, departureTime || undefined, {
      transportMode,
      avoidTolls,
      avoidHighways,
    });
  };

  return (
    <Card className={styles.root}>
      <CardHeader
        image={<VehicleCar24Regular />}
        header={<Text weight="semibold">Plan Your Journey</Text>}
      />
      <div className={styles.locationRow}>
        <span className={`${styles.dot} ${styles.originDot}`} />
        <div className={styles.locationInput}>
          <LocationSearch
            label="Origin"
            value={originText}
            onChange={setOriginText}
            onLocationSelect={setOriginLocation}
          />
        </div>
      </div>
      <div className={styles.locationRow}>
        <span className={`${styles.dot} ${styles.destDot}`} />
        <div className={styles.locationInput}>
          <LocationSearch
            label="Destination"
            value={destText}
            onChange={setDestText}
            onLocationSelect={setDestLocation}
          />
        </div>
      </div>
      <Divider />
      <div className={styles.fieldGroup}>
        <Label htmlFor="departure-time">Departure Time (optional)</Label>
        <Input
          id="departure-time"
          type="datetime-local"
          value={departureTime}
          onChange={(_, data) => setDepartureTime(data.value)}
        />
      </div>
      <Divider />
      <div className={styles.fieldGroup}>
        <Label>Transport Mode</Label>
        <RadioGroup
          value={transportMode}
          onChange={(_, data) => setTransportMode(data.value as TransportMode)}
          layout="horizontal"
        >
          <Radio value="car" label="Car" />
          <Radio value="transit" label="Transit" />
          <Radio value="bicycle" label="Bicycle" />
          <Radio value="walk" label="Walk" />
        </RadioGroup>
      </div>
      <div className={styles.checkboxGroup}>
        <Checkbox
          label="Avoid tolls"
          checked={avoidTolls}
          onChange={(_, data) => setAvoidTolls(!!data.checked)}
        />
        <Checkbox
          label="Avoid highways"
          checked={avoidHighways}
          onChange={(_, data) => setAvoidHighways(!!data.checked)}
        />
      </div>
      <Button
        appearance="primary"
        disabled={!canSubmit}
        onClick={handleSubmit}
        icon={isLoading ? <Spinner size="tiny" /> : undefined}
        className={styles.submitButton}
      >
        {isLoading ? "Planning..." : "Find Routes"}
      </Button>
    </Card>
  );
}
