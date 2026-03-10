import {
  makeStyles,
  tokens,
  ToggleButton,
  ToolbarButton,
  Tooltip,
  Divider,
} from "@fluentui/react-components";
import {
  ZoomIn24Regular,
  ZoomOut24Regular,
  VehicleCar24Regular,
  WeatherSunny24Regular,
  Location24Regular,
  GroupList24Regular,
  Map24Regular,
  Globe24Regular,
  WeatherMoon24Regular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  controlPanel: {
    position: "absolute" as const,
    top: tokens.spacingVerticalM,
    right: tokens.spacingHorizontalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow8,
    padding: tokens.spacingVerticalXS,
    zIndex: 1,
  },
  divider: {
    margin: `${tokens.spacingVerticalXXS} 0`,
  },
});

interface MapControlsProps {
  showTraffic: boolean;
  onToggleTraffic: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  mapStyle?: "road" | "satellite" | "night";
  onCycleMapStyle?: () => void;
  showWeather?: boolean;
  onToggleWeather?: () => void;
  showPOIs?: boolean;
  onTogglePOIs?: () => void;
  enableClustering?: boolean;
  onToggleClustering?: () => void;
}

export function MapControls({
  showTraffic,
  onToggleTraffic,
  onZoomIn,
  onZoomOut,
  mapStyle,
  onCycleMapStyle,
  showWeather,
  onToggleWeather,
  showPOIs,
  onTogglePOIs,
  enableClustering,
  onToggleClustering,
}: MapControlsProps) {
  const styles = useStyles();

  const hasExtras = onToggleWeather || onTogglePOIs || onToggleClustering;

  const styleIcon =
    mapStyle === "satellite"
      ? <Globe24Regular />
      : mapStyle === "night"
        ? <WeatherMoon24Regular />
        : <Map24Regular />;
  const styleLabel =
    mapStyle === "satellite"
      ? "Satellite"
      : mapStyle === "night"
        ? "Night"
        : "Road";

  return (
    <div className={styles.controlPanel}>
      {onCycleMapStyle && (
        <Tooltip content={`Map style: ${styleLabel}`} relationship="label">
          <ToolbarButton
            icon={styleIcon}
            onClick={onCycleMapStyle}
            aria-label="Cycle map style"
          />
        </Tooltip>
      )}

      <Tooltip content="Toggle traffic" relationship="label">
        <ToggleButton
          icon={<VehicleCar24Regular />}
          checked={showTraffic}
          onClick={onToggleTraffic}
          appearance={showTraffic ? "primary" : "subtle"}
          aria-label="Toggle traffic layer"
        />
      </Tooltip>

      {onToggleWeather && (
        <Tooltip content="Toggle weather" relationship="label">
          <ToggleButton
            icon={<WeatherSunny24Regular />}
            checked={!!showWeather}
            onClick={onToggleWeather}
            appearance={showWeather ? "primary" : "subtle"}
            aria-label="Toggle weather overlay"
          />
        </Tooltip>
      )}

      {onTogglePOIs && (
        <Tooltip content="Toggle POIs" relationship="label">
          <ToggleButton
            icon={<Location24Regular />}
            checked={!!showPOIs}
            onClick={onTogglePOIs}
            appearance={showPOIs ? "primary" : "subtle"}
            aria-label="Toggle points of interest"
          />
        </Tooltip>
      )}

      {onToggleClustering && (
        <Tooltip content="Toggle clustering" relationship="label">
          <ToggleButton
            icon={<GroupList24Regular />}
            checked={!!enableClustering}
            onClick={onToggleClustering}
            appearance={enableClustering ? "primary" : "subtle"}
            aria-label="Toggle marker clustering"
          />
        </Tooltip>
      )}

      {hasExtras && <Divider className={styles.divider} />}

      <Tooltip content="Zoom in" relationship="label">
        <ToolbarButton
          icon={<ZoomIn24Regular />}
          onClick={onZoomIn}
          aria-label="Zoom in"
        />
      </Tooltip>

      <Tooltip content="Zoom out" relationship="label">
        <ToolbarButton
          icon={<ZoomOut24Regular />}
          onClick={onZoomOut}
          aria-label="Zoom out"
        />
      </Tooltip>
    </div>
  );
}
