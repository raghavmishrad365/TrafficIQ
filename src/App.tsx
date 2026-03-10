import { Routes, Route } from "react-router-dom";
import { Toaster } from "@fluentui/react-components";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { JourneyPlannerPage } from "./pages/JourneyPlannerPage";
import { JourneyDetailsPage } from "./pages/JourneyDetailsPage";
import { SavedJourneysPage } from "./pages/SavedJourneysPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ShipmentDashboardPage } from "./pages/ShipmentDashboardPage";
import { DeliveryPlannerPage } from "./pages/DeliveryPlannerPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { FleetManagementPage } from "./pages/FleetManagementPage";
import { IoTDeviceManagementPage } from "./pages/IoTDeviceManagementPage";
import { WorkOrdersPage } from "./pages/WorkOrdersPage";
import { InventoryPage } from "./pages/InventoryPage";
import { SchedulingBoardPage } from "./pages/SchedulingBoardPage";
import { ShipmentTrackingPage } from "./pages/ShipmentTrackingPage";
import { PredictiveMaintenancePage } from "./pages/PredictiveMaintenancePage";
import { ReturnsPage } from "./pages/ReturnsPage";
import { ChatPanel } from "./components/chat/ChatPanel";
import { ROUTES } from "./config/routes";

function App() {
  return (
    <>
      <Toaster toasterId="traffic-toaster" position="top-end" />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route
            path={ROUTES.SHIPMENTS}
            element={<ShipmentDashboardPage />}
          />
          <Route
            path={ROUTES.DELIVERY_PLANNER}
            element={<DeliveryPlannerPage />}
          />
          <Route path={ROUTES.FLEET} element={<FleetManagementPage />} />
          <Route path={ROUTES.IOT_DEVICES} element={<IoTDeviceManagementPage />} />
          <Route path={ROUTES.WORK_ORDERS} element={<WorkOrdersPage />} />
          <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />
          <Route path={ROUTES.SCHEDULING} element={<SchedulingBoardPage />} />
          <Route path={ROUTES.TRACKING} element={<ShipmentTrackingPage />} />
          <Route
            path={ROUTES.MAINTENANCE}
            element={<PredictiveMaintenancePage />}
          />
          <Route path={ROUTES.RETURNS} element={<ReturnsPage />} />
          <Route
            path={ROUTES.JOURNEY_PLANNER}
            element={<JourneyPlannerPage />}
          />
          <Route
            path={ROUTES.JOURNEY_DETAILS}
            element={<JourneyDetailsPage />}
          />
          <Route
            path={ROUTES.SAVED_JOURNEYS}
            element={<SavedJourneysPage />}
          />
          <Route
            path={ROUTES.NOTIFICATIONS}
            element={<NotificationsPage />}
          />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        </Route>
      </Routes>
      <ChatPanel />
    </>
  );
}

export default App;
