import {
  makeStyles,
  tokens,
  Text,
  Card,
  CardHeader,
  Button,
  shorthands,
} from "@fluentui/react-components";
import {
  ArrowLeft24Regular,
  Clock20Regular,
  Map20Regular,
  Warning20Regular,
} from "@fluentui/react-icons";
import { useParams, useNavigate } from "react-router-dom";
import { TrafficMap } from "../components/map/TrafficMap";
import { DirectionSteps } from "../components/journey/DirectionSteps";
import { IncidentList } from "../components/traffic/IncidentList";
import { useJourneyContext } from "../context/JourneyContext";
import { ShareMenu } from "../components/common/ShareMenu";

const useStyles = makeStyles({
  root: {
    borderTop: "3px solid",
    borderImage: `linear-gradient(90deg, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundPressed}) 1`,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  headerInfo: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
  },
  summaryBar: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
  summaryTile: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    borderRadius: tokens.borderRadiusMedium,
    flex: "1 1 auto",
    minWidth: "140px",
  },
  tileDuration: {
    backgroundColor: tokens.colorBrandBackground2,
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: tokens.colorBrandBackground,
  },
  tileDistance: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: tokens.colorNeutralStroke1,
  },
  tileIncidents: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: tokens.colorPaletteYellowBorder1,
  },
  tileIcon: {
    color: tokens.colorNeutralForeground3,
  },
  tileContent: {
    display: "flex",
    flexDirection: "column",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: tokens.spacingHorizontalL,
    "@media (max-width: 860px)": {
      gridTemplateColumns: "1fr",
    },
  },
  mapPanel: {
    border: "1px solid " + tokens.colorNeutralStroke2,
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.overflow("hidden"),
    boxShadow: tokens.shadow4,
    minHeight: "500px",
  },
  detailsPanel: {
    borderLeft: "1px solid " + tokens.colorNeutralStroke2,
    paddingLeft: tokens.spacingHorizontalL,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    overflow: "auto",
  },
});

export function JourneyDetailsPage() {
  const styles = useStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeJourney, plannedJourney } = useJourneyContext();

  // Try activeJourney first, then fall back to finding in plannedJourney routes
  const route =
    activeJourney && activeJourney.id === id
      ? activeJourney
      : plannedJourney?.routes.find((r) => r.id === id) ?? null;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Button
          icon={<ArrowLeft24Regular />}
          appearance="subtle"
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
        <div className={styles.headerInfo}>
          <Text size={600} weight="semibold">
            Journey Details
          </Text>
          {route && (
            <Text size={300}>{route.summary}</Text>
          )}
        </div>
        {route && plannedJourney && (
          <div className={styles.headerActions}>
            <ShareMenu
              route={{
                origin: { lat: plannedJourney.origin.coordinates.lat, lng: plannedJourney.origin.coordinates.lng, label: plannedJourney.origin.label },
                destination: { lat: plannedJourney.destination.coordinates.lat, lng: plannedJourney.destination.coordinates.lng, label: plannedJourney.destination.label },
              }}
              size="medium"
            />
          </div>
        )}
      </div>

      {route && (
        <div className={styles.summaryBar}>
          <div className={`${styles.summaryTile} ${styles.tileDuration}`}>
            <Clock20Regular className={styles.tileIcon} />
            <div className={styles.tileContent}>
              <Text size={100}>Duration</Text>
              <Text weight="semibold" size={400}>
                {route.durationInTrafficMinutes} min
              </Text>
            </div>
          </div>
          <div className={`${styles.summaryTile} ${styles.tileDistance}`}>
            <Map20Regular className={styles.tileIcon} />
            <div className={styles.tileContent}>
              <Text size={100}>Distance</Text>
              <Text weight="semibold" size={400}>
                {route.distanceKm.toFixed(1)} km
              </Text>
            </div>
          </div>
          <div className={`${styles.summaryTile} ${styles.tileIncidents}`}>
            <Warning20Regular className={styles.tileIcon} />
            <div className={styles.tileContent}>
              <Text size={100}>Incidents</Text>
              <Text weight="semibold" size={400}>
                {route.incidents.length}
              </Text>
            </div>
          </div>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.mapPanel}>
          <TrafficMap
            routes={route ? [route] : []}
            selectedRouteId={route?.id}
            incidents={route?.incidents}
          />
        </div>
        <div className={styles.detailsPanel}>
          {route ? (
            <>
              <Card>
                <CardHeader
                  header={<Text weight="semibold">Directions</Text>}
                  description={`${route.steps.length} steps`}
                />
                <DirectionSteps steps={route.steps} />
              </Card>
              <Card>
                <CardHeader
                  header={<Text weight="semibold">Traffic Incidents</Text>}
                  description={`${route.incidents.length} incidents along route`}
                />
                <IncidentList incidents={route.incidents} />
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader
                header={<Text weight="semibold">No Route Selected</Text>}
                description="Go back and select a route to view details"
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
