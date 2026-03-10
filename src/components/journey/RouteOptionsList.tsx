import { makeStyles, tokens, Text } from "@fluentui/react-components";
import { RouteOptionCard } from "./RouteOptionCard";
import type { RouteOption, Location } from "../../types/journey";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacingVerticalXXL,
  },
});

interface RouteOptionsListProps {
  routes: RouteOption[];
  selectedRouteId?: string;
  origin?: Location | null;
  destination?: Location | null;
  onSelectRoute: (route: RouteOption) => void;
  onSaveRoute?: (route: RouteOption) => void;
}

export function RouteOptionsList({
  routes,
  selectedRouteId,
  origin,
  destination,
  onSelectRoute,
  onSaveRoute,
}: RouteOptionsListProps) {
  const styles = useStyles();

  if (routes.length === 0) {
    return (
      <div className={styles.empty}>
        <Text size={300}>No routes found</Text>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {routes.map((route) => (
        <RouteOptionCard
          key={route.id}
          route={route}
          isSelected={route.id === selectedRouteId}
          origin={origin ?? undefined}
          destination={destination ?? undefined}
          onSelect={onSelectRoute}
          onSave={onSaveRoute}
        />
      ))}
    </div>
  );
}
