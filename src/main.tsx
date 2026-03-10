import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FluentProvider } from "@fluentui/react-components";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { queryClient } from "./config/queryClient";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import { JourneyProvider } from "./context/JourneyContext";
import { ChatProvider } from "./context/ChatContext";
import { MapSettingsProvider } from "./context/MapSettingsContext";
import { DataverseClient } from "./services/dataverseClient";
import { storageService } from "./services/storageService";
import { DEFAULT_AGENT_SETTINGS } from "./types/settings";
import App from "./App";
import "./index.css";

// Initialize Power Apps SDK and sync Dataverse data on startup
DataverseClient.initialize().then(() => {
  if (DataverseClient.isConnected) {
    console.log("[TrafficInfo] Connected to Power Platform — syncing data...");
    Promise.all([
      // Traffic & Journey
      storageService.syncJourneysFromDataverse(),
      storageService.syncPreferencesFromDataverse(),
      storageService.syncNotificationsFromDataverse(),
      storageService.syncRouteHistoryFromDataverse(),
      storageService.syncTrafficIncidentsFromDataverse(),
      // Supply Chain
      storageService.syncShipmentsFromDataverse(),
      storageService.syncWarehousesFromDataverse(),
      storageService.syncInventoryFromDataverse(),
      storageService.syncFleetFromDataverse(),
      storageService.syncWorkOrdersFromDataverse(),
      storageService.syncTechniciansFromDataverse(),
      storageService.syncVehicleHealthFromDataverse(),
      storageService.syncMaintenanceAlertsFromDataverse(),
      storageService.syncMaintenanceRecordsFromDataverse(),
      storageService.syncReturnOrdersFromDataverse(),
      storageService.syncKPIsFromDataverse(),
      // Settings
      storageService.syncAppSettingsFromDataverse(),
      storageService.syncAgentSettingsFromDataverse(DEFAULT_AGENT_SETTINGS),
    ]).then(() => {
      console.log("[TrafficInfo] Dataverse sync complete");
    });
  } else {
    console.log("[TrafficInfo] Running in local mode (localStorage only)");
  }
});

function ThemedApp() {
  const { fluentTheme } = useTheme();
  return (
    <FluentProvider theme={fluentTheme}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MapSettingsProvider>
            <NotificationProvider>
              <JourneyProvider>
                <ChatProvider>
                  <App />
                </ChatProvider>
              </JourneyProvider>
            </NotificationProvider>
          </MapSettingsProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </FluentProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  </StrictMode>
);
