import React from "react";
import { Text, makeStyles, tokens, shorthands } from "@fluentui/react-components";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    ...shorthands.padding(tokens.spacingVerticalXXL),
    gap: tokens.spacingVerticalM,
    textAlign: "center",
  },
  icon: {
    fontSize: "48px",
    color: tokens.colorNeutralForeground3,
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: tokens.colorNeutralBackground3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animationName: {
      "0%": { transform: "translateY(0)" },
      "50%": { transform: "translateY(-6px)" },
      "100%": { transform: "translateY(0)" },
    },
    animationDuration: "3s",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
  },
  description: {
    color: tokens.colorNeutralForeground3,
    maxWidth: "360px",
  },
});

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <Text weight="semibold" size={400}>
        {title}
      </Text>
      {description && (
        <Text className={styles.description} size={300}>
          {description}
        </Text>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
