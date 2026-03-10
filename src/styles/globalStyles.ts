import { makeStyles, tokens } from "@fluentui/react-components";

export const useGlobalStyles = makeStyles({
  app: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  scrollContent: {
    flex: 1,
    overflow: "auto",
    padding: tokens.spacingHorizontalL,
  },
  mapContainer: {
    width: "100%",
    height: "100%",
    minHeight: "400px",
  },
});
