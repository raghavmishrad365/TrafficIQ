import { useState } from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import { Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { AppNavigation } from "./AppNavigation";
import { PageContainer } from "./PageContainer";
import { useSavedJourneys } from "../../hooks/useJourneys";
import { useJourneyMonitor } from "../../hooks/useJourneyMonitor";
import { useMorningAlertScheduler } from "../../hooks/useMorningAlertScheduler";
import { ROUTES } from "../../config/routes";

const useStyles = makeStyles({
  root: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground3,
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
  },
});

export function AppLayout() {
  const styles = useStyles();
  const [navOpen, setNavOpen] = useState(true);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const { data: savedJourneys } = useSavedJourneys();
  const location = useLocation();
  const isDashboard = location.pathname === ROUTES.DASHBOARD;

  // Background monitor: polls traffic incidents for saved journey corridors
  useJourneyMonitor(savedJourneys || [], "traffic-toaster");

  // Morning alert scheduler: checks saved journey alert configs every minute
  useMorningAlertScheduler(savedJourneys || [], "traffic-toaster");

  return (
    <div className={styles.root}>
      <AppNavigation
        open={navOpen}
        collapsed={navCollapsed}
        onToggleCollapse={() => setNavCollapsed((prev) => !prev)}
      />
      <div className={styles.content}>
        <AppHeader onMenuToggle={() => setNavOpen((prev) => !prev)} />
        <PageContainer noPadding={isDashboard}>
          <Outlet />
        </PageContainer>
      </div>
    </div>
  );
}
