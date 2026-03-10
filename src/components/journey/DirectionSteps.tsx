import { makeStyles, tokens, Text } from "@fluentui/react-components";
import { ArrowRight24Regular } from "@fluentui/react-icons";
import type { RouteStep } from "../../types/journey";
import { formatDuration, formatDistance } from "../../utils/formatters";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  step: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    position: "relative" as const,
  },
  stepNumber: {
    minWidth: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  stepMeta: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
  },
  icon: {
    flexShrink: 0,
    marginTop: "2px",
    color: tokens.colorBrandForeground1,
  },
  roadName: {
    color: tokens.colorNeutralForeground3,
  },
  stepConnector: {
    position: "absolute" as const,
    left: "13px",
    top: "36px",
    bottom: "-2px",
    width: "2px",
    backgroundColor: tokens.colorNeutralStroke2,
  },
});

interface DirectionStepsProps {
  steps: RouteStep[];
}

export function DirectionSteps({ steps }: DirectionStepsProps) {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      {steps.map((step, index) => (
        <div key={index} className={styles.step}>
          <div className={styles.stepNumber}>{index + 1}</div>
          {index < steps.length - 1 && <div className={styles.stepConnector} />}
          <ArrowRight24Regular className={styles.icon} />
          <div className={styles.stepContent}>
            <Text>{step.instruction}</Text>
            {step.roadName && (
              <Text size={200} className={styles.roadName}>
                {step.roadName}
              </Text>
            )}
            <div className={styles.stepMeta}>
              <Text size={200}>{formatDistance(step.distanceKm)}</Text>
              <Text size={200}>{formatDuration(step.durationMinutes)}</Text>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
