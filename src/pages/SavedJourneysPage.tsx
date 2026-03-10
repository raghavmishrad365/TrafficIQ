import {
  makeStyles,
  shorthands,
  tokens,
  Text,
  Button,
} from "@fluentui/react-components";
import { Add24Regular, Bookmark24Regular } from "@fluentui/react-icons";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../config/routes";
import { SavedJourneyList } from "../components/saved/SavedJourneyList";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { useSavedJourneys, useDeleteJourney, useUpdateJourney } from "../hooks/useJourneys";
import type { SavedJourney } from "../types/journey";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  pageHeader: {
    borderTop: "3px solid",
    borderImage: `linear-gradient(90deg, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundPressed}) 1`,
    ...shorthands.padding(tokens.spacingVerticalM, "0"),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleGroup: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  gradientButton: {
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundPressed})`,
    color: tokens.colorNeutralForegroundOnBrand,
    ":hover": {
      background: `linear-gradient(135deg, ${tokens.colorBrandBackgroundHover}, ${tokens.colorBrandBackground})`,
    },
  },
});

export function SavedJourneysPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { data: journeys = [], isLoading } = useSavedJourneys();
  const deleteJourney = useDeleteJourney();
  const updateJourney = useUpdateJourney();

  const handleNavigate = (journey: SavedJourney) => {
    navigate(ROUTES.JOURNEY_PLANNER, {
      state: { origin: journey.origin, destination: journey.destination },
    });
  };

  const handleToggleMorningAlert = (journey: SavedJourney) => {
    const updated = {
      ...journey,
      morningAlert: journey.morningAlert
        ? { ...journey.morningAlert, enabled: !journey.morningAlert.enabled }
        : {
            enabled: true,
            time: "07:00",
            daysOfWeek: [1, 2, 3, 4, 5],
            pushEnabled: true,
            emailEnabled: false,
          },
    };
    updateJourney.mutate(updated);
  };

  if (isLoading) return <LoadingSpinner label="Loading saved journeys..." />;

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <Text size={600} weight="semibold">
            Saved Journeys
          </Text>
          <Text size={200}>Your frequently used routes and commutes</Text>
        </div>
        <Button
          icon={<Add24Regular />}
          appearance="primary"
          className={styles.gradientButton}
          onClick={() => navigate(ROUTES.JOURNEY_PLANNER)}
        >
          Plan New Journey
        </Button>
      </div>
      {journeys.length === 0 ? (
        <EmptyState
          icon={<Bookmark24Regular />}
          title="No saved journeys yet"
          description="Plan a journey and save it for quick access. You can set up morning alerts for your daily commute."
        />
      ) : (
        <SavedJourneyList
          journeys={journeys}
          onNavigate={handleNavigate}
          onDelete={(id) => deleteJourney.mutate(id)}
          onToggleMorningAlert={handleToggleMorningAlert}
        />
      )}
    </div>
  );
}
