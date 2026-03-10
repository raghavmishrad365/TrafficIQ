import React from "react";
import {
  Card,
  CardHeader,
  Button,
  Text,
  Badge,
  makeStyles,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import {
  Delete24Regular,
  Alert24Regular,
} from "@fluentui/react-icons";
import type { SavedJourney } from "../../types/journey";
import { ShareMenu } from "../common/ShareMenu";

export interface SavedJourneyCardProps {
  journey: SavedJourney;
  onNavigate: (journey: SavedJourney) => void;
  onDelete: (id: string) => void;
  onToggleMorningAlert: (journey: SavedJourney) => void;
}

const MAX_LABEL_LENGTH = 28;

function truncateLabel(label: string): string {
  if (label.length <= MAX_LABEL_LENGTH) return label;
  return label.slice(0, MAX_LABEL_LENGTH - 1) + "\u2026";
}

const useStyles = makeStyles({
  card: {
    width: "100%",
    ...shorthands.padding(tokens.spacingVerticalM),
    transitionProperty: "box-shadow, transform",
    transitionDuration: "200ms",
    borderRadius: tokens.borderRadiusXLarge,
    ":hover": {
      boxShadow: tokens.shadow8,
      transform: "translateY(-1px)",
    },
  },
  route: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalS,
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  routeDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  originDot: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
    boxShadow: `0 0 0 2px ${tokens.colorPaletteGreenBorder1}`,
  },
  destDot: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    boxShadow: `0 0 0 2px ${tokens.colorPaletteRedBorder1}`,
  },
  routeLine: {
    width: "24px",
    height: "0",
    borderBottom: "2px dashed " + tokens.colorNeutralStroke2,
    flexShrink: 0,
  },
  routeLabel: {
    maxWidth: "140px",
    ...shorthands.overflow("hidden"),
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
    flexWrap: "wrap",
    alignItems: "center",
  },
  separator: {
    width: "1px",
    height: "16px",
    backgroundColor: tokens.colorNeutralStroke2,
  },
  headerAction: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
});

function getTransportModeLabel(mode: string): string {
  switch (mode) {
    case "car":
      return "Car";
    case "transit":
      return "Transit";
    case "bicycle":
      return "Bicycle";
    case "walk":
      return "Walk";
    default:
      return mode;
  }
}

export const SavedJourneyCard: React.FC<SavedJourneyCardProps> = ({
  journey,
  onNavigate,
  onDelete,
  onToggleMorningAlert,
}) => {
  const styles = useStyles();

  return (
    <Card className={styles.card}>
      <CardHeader
        header={
          <Text weight="semibold" size={400}>
            {journey.name}
          </Text>
        }
        action={
          <div className={styles.headerAction}>
            {journey.morningAlert?.enabled && (
              <Badge appearance="filled" color="brand" size="small">
                Alert Active
              </Badge>
            )}
            <Text size={200}>{getTransportModeLabel(journey.preferences.transportMode)}</Text>
          </div>
        }
      />

      <div className={styles.route}>
        <span className={`${styles.routeDot} ${styles.originDot}`} />
        <Text className={styles.routeLabel} size={200} title={journey.origin.label}>
          {truncateLabel(journey.origin.label)}
        </Text>
        <span className={styles.routeLine} />
        <span className={`${styles.routeDot} ${styles.destDot}`} />
        <Text className={styles.routeLabel} size={200} title={journey.destination.label}>
          {truncateLabel(journey.destination.label)}
        </Text>
      </div>

      <div className={styles.actions}>
        <Button
          appearance="primary"
          size="small"
          onClick={() => onNavigate(journey)}
        >
          Navigate
        </Button>
        <span className={styles.separator} />
        <Button
          appearance="subtle"
          size="small"
          icon={<Alert24Regular />}
          onClick={() => onToggleMorningAlert(journey)}
        >
          {journey.morningAlert?.enabled ? "Disable Alert" : "Morning Alert"}
        </Button>
        <Button
          appearance="subtle"
          size="small"
          icon={<Delete24Regular />}
          onClick={() => onDelete(journey.id)}
        >
          Delete
        </Button>
        <ShareMenu
          route={{
            origin: { lat: journey.origin.coordinates.lat, lng: journey.origin.coordinates.lng, label: journey.origin.label },
            destination: { lat: journey.destination.coordinates.lat, lng: journey.destination.coordinates.lng, label: journey.destination.label },
            transportMode: journey.preferences.transportMode,
          }}
        />
      </div>
    </Card>
  );
};

export default SavedJourneyCard;
