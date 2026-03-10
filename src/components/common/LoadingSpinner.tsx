import React from "react";
import { Spinner, makeStyles, tokens, shorthands } from "@fluentui/react-components";

export interface LoadingSpinnerProps {
  label?: string;
  size?: "tiny" | "small" | "medium" | "large";
}

const useStyles = makeStyles({
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    ...shorthands.padding(tokens.spacingVerticalXL),
    width: "100%",
  },
});

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = "Loading...",
  size = "medium",
}) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Spinner size={size} label={label} />
    </div>
  );
};

export default LoadingSpinner;
