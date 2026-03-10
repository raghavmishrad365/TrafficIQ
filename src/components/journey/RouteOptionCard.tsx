import {
  makeStyles,
  tokens,
  Card,
  Text,
  Badge,
  Button,
  mergeClasses,
  shorthands,
} from "@fluentui/react-components";
import {
  Bookmark24Regular,
  Checkmark20Regular,
} from "@fluentui/react-icons";
import type { RouteOption, Location } from "../../types/journey";
import { formatDuration, formatDistance } from "../../utils/formatters";
import { ShareMenu } from "../common/ShareMenu";

const useStyles = makeStyles({
  card: {
    cursor: "pointer",
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    transitionProperty: "border-color, background-color, box-shadow, transform",
    transitionDuration: "200ms",
    borderRadius: tokens.borderRadiusXLarge,
    ":hover": {
      boxShadow: tokens.shadow4,
    },
  },
  selected: {
    ...shorthands.border("1px", "solid", tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
    boxShadow: "0 0 0 2px " + tokens.colorBrandBackground,
    transform: "scale(1.01)",
  },
  recommended: {
    borderTopWidth: "3px",
    borderTopStyle: "solid",
    borderTopColor: tokens.colorBrandBackground,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacingVerticalS,
  },
  summary: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    gap: "2px",
  },
  delay: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalS,
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalM,
  },
  delayLow: { color: "var(--traffic-clear)" },
  delayMedium: { color: "var(--traffic-moderate)" },
  delayHigh: { color: "var(--traffic-heavy)" },
});

interface RouteOptionCardProps {
  route: RouteOption;
  isSelected?: boolean;
  origin?: Location;
  destination?: Location;
  onSelect?: (route: RouteOption) => void;
  onSave?: (route: RouteOption) => void;
}

export function RouteOptionCard({
  route,
  isSelected,
  origin,
  destination,
  onSelect,
  onSave,
}: RouteOptionCardProps) {
  const styles = useStyles();

  const delayClass =
    route.trafficDelayMinutes < 5
      ? styles.delayLow
      : route.trafficDelayMinutes < 15
        ? styles.delayMedium
        : styles.delayHigh;

  return (
    <Card
      className={mergeClasses(
        styles.card,
        isSelected ? styles.selected : undefined,
        route.isRecommended ? styles.recommended : undefined,
      )}
      onClick={() => onSelect?.(route)}
    >
      <div className={styles.header}>
        <div className={styles.summary}>
          <Text weight="semibold">{route.summary}</Text>
          {route.isRecommended && (
            <Badge appearance="filled" color="brand" icon={<Checkmark20Regular />}>
              Recommended
            </Badge>
          )}
        </div>
      </div>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <Text size={200}>Duration</Text>
          <Text weight="semibold">
            {formatDuration(route.durationInTrafficMinutes)}
          </Text>
        </div>
        <div className={styles.stat}>
          <Text size={200}>Distance</Text>
          <Text weight="semibold">{formatDistance(route.distanceKm)}</Text>
        </div>
        <div className={styles.stat}>
          <Text size={200}>Incidents</Text>
          <Text weight="semibold">{route.incidents.length}</Text>
        </div>
      </div>
      {route.trafficDelayMinutes > 0 && (
        <div className={styles.delay}>
          <Text size={200}>Traffic delay:</Text>
          <Text weight="semibold" className={delayClass}>
            +{formatDuration(route.trafficDelayMinutes)}
          </Text>
        </div>
      )}
      <div className={styles.actions}>
        <Button
          appearance={isSelected ? "primary" : "secondary"}
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(route);
          }}
        >
          {isSelected ? "View Details" : "Select Route"}
        </Button>
        {onSave && (
          <Button
            appearance="subtle"
            size="small"
            icon={<Bookmark24Regular />}
            onClick={(e) => {
              e.stopPropagation();
              onSave(route);
            }}
          >
            Save
          </Button>
        )}
        {origin && destination && (
          <ShareMenu
            route={{
              origin: { lat: origin.coordinates.lat, lng: origin.coordinates.lng, label: origin.label },
              destination: { lat: destination.coordinates.lat, lng: destination.coordinates.lng, label: destination.label },
            }}
          />
        )}
      </div>
    </Card>
  );
}
