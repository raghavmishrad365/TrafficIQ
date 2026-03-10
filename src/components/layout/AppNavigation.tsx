import {
  makeStyles,
  tokens,
  Text,
  Divider,
  shorthands,
  Button,
  Tooltip,
  mergeClasses,
} from "@fluentui/react-components";
import {
  Map24Regular,
  VehicleTruckProfile24Regular,
  VehicleCar24Regular,
  Bookmark24Regular,
  Alert24Regular,
  Settings24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
  DataTrending24Regular,
  Box24Regular,
  Wrench24Regular,
  CalendarLtr24Regular,
  Search24Regular,
  Heart24Regular,
  ArrowUndo24Regular,
  PlugConnected24Regular,
} from "@fluentui/react-icons";
import {
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavDrawerFooter,
  NavItem,
} from "@fluentui/react-components";
import { useNavigate, useLocation } from "react-router-dom";

const EXPANDED_WIDTH = "240px";
const COLLAPSED_WIDTH = "48px";
const TRANSITION_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";
const TRANSITION_DURATION = "250ms";

const useStyles = makeStyles({
  nav: {
    height: "100%",
    transitionProperty: "width, min-width",
    transitionDuration: TRANSITION_DURATION,
    transitionTimingFunction: TRANSITION_EASING,
  },
  navExpanded: {
    width: EXPANDED_WIDTH,
    minWidth: EXPANDED_WIDTH,
  },
  navCollapsed: {
    width: COLLAPSED_WIDTH,
    minWidth: COLLAPSED_WIDTH,
  },
  navHeader: {
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
  },
  navHeaderCollapsed: {
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalXS),
    display: "flex",
    justifyContent: "center",
  },
  navBody: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
  },
  mainItems: {
    display: "flex",
    flexDirection: "column",
  },
  bottomSection: {
    display: "flex",
    flexDirection: "column",
  },
  navItemLabel: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    transitionProperty: "width, opacity",
    transitionDuration: TRANSITION_DURATION,
    transitionTimingFunction: TRANSITION_EASING,
  },
  navItemLabelVisible: {
    width: "auto",
    opacity: 1,
  },
  navItemLabelHidden: {
    width: "0",
    opacity: 0,
  },
  navItemActive: {
    borderLeft: `3px solid ${tokens.colorBrandBackground}`,
    background: `linear-gradient(90deg, ${tokens.colorBrandBackground2}, transparent)`,
  },
  footer: {
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    color: tokens.colorNeutralForeground4,
  },
  footerCollapsed: {
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalXS),
    textAlign: "center" as const,
  },
  collapseToggle: {
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalM),
    display: "flex",
    justifyContent: "center",
    marginBottom: tokens.spacingVerticalXS,
  },
  collapseToggleCollapsed: {
    ...shorthands.padding(tokens.spacingVerticalXS, "0"),
  },
  collapseButton: {
    minWidth: "unset",
    color: tokens.colorNeutralForeground3,
    ":hover": {
      color: tokens.colorNeutralForeground2,
    },
  },
  footerText: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    transitionProperty: "width, opacity",
    transitionDuration: TRANSITION_DURATION,
    transitionTimingFunction: TRANSITION_EASING,
  },
  footerTextVisible: {
    width: "auto",
    opacity: 1,
  },
  footerTextHidden: {
    width: "0",
    opacity: 0,
  },
});

interface AppNavigationProps {
  open: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const mainNavItems = [
  { value: "/analytics", icon: <DataTrending24Regular />, label: "Analytics" },
  { value: "/", icon: <Map24Regular />, label: "Dashboard" },
  { value: "/shipments", icon: <VehicleTruckProfile24Regular />, label: "Shipments" },
  { value: "/tracking", icon: <Search24Regular />, label: "Shipment Tracking" },
  { value: "/delivery-planner", icon: <VehicleCar24Regular />, label: "Delivery Planner" },
  { value: "/fleet", icon: <VehicleCar24Regular />, label: "Fleet Management" },
  { value: "/iot-devices", icon: <PlugConnected24Regular />, label: "IoT Devices" },
  { value: "/maintenance", icon: <Heart24Regular />, label: "Predictive Maintenance" },
  { value: "/scheduling", icon: <CalendarLtr24Regular />, label: "Resource Scheduling" },
  { value: "/work-orders", icon: <Wrench24Regular />, label: "Work Orders" },
  { value: "/inventory", icon: <Box24Regular />, label: "Inventory" },
  { value: "/returns", icon: <ArrowUndo24Regular />, label: "Returns" },
  { value: "/journey", icon: <VehicleCar24Regular />, label: "Plan Journey" },
  { value: "/saved", icon: <Bookmark24Regular />, label: "Saved Journeys" },
  {
    value: "/notifications",
    icon: <Alert24Regular />,
    label: "Notifications",
  },
];

function NavItemWithTooltip({
  item,
  collapsed,
  isActive,
  activeClass,
  labelClass,
  onClick,
}: {
  item: { value: string; icon: React.ReactElement; label: string };
  collapsed: boolean;
  isActive: boolean;
  activeClass: string;
  labelClass: string;
  onClick: () => void;
}) {
  const navItem = (
    <NavItem
      value={item.value}
      icon={item.icon}
      onClick={onClick}
      className={isActive ? activeClass : undefined}
    >
      <span className={labelClass}>{item.label}</span>
    </NavItem>
  );

  if (collapsed) {
    return (
      <Tooltip content={item.label} relationship="label" positioning="after">
        {navItem}
      </Tooltip>
    );
  }

  return navItem;
}

export function AppNavigation({
  open,
  collapsed,
  onToggleCollapse,
}: AppNavigationProps) {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();

  const navClassName = mergeClasses(
    styles.nav,
    collapsed ? styles.navCollapsed : styles.navExpanded
  );

  const headerClassName = mergeClasses(
    styles.navHeader,
    collapsed ? styles.navHeaderCollapsed : undefined
  );

  const labelClassName = mergeClasses(
    styles.navItemLabel,
    collapsed ? styles.navItemLabelHidden : styles.navItemLabelVisible
  );

  const footerClassName = mergeClasses(
    styles.footer,
    collapsed ? styles.footerCollapsed : undefined
  );

  const footerTextClassName = mergeClasses(
    styles.footerText,
    collapsed ? styles.footerTextHidden : styles.footerTextVisible
  );

  const collapseToggleClassName = mergeClasses(
    styles.collapseToggle,
    collapsed ? styles.collapseToggleCollapsed : undefined
  );

  const settingsItem = {
    value: "/settings",
    icon: <Settings24Regular />,
    label: "Settings",
  };

  const collapseTooltipContent = collapsed ? "Expand navigation" : "Collapse navigation";

  return (
    <NavDrawer
      open={open}
      type="inline"
      className={navClassName}
      selectedValue={location.pathname}
    >
      <NavDrawerHeader className={headerClassName} />
      <NavDrawerBody>
        <div className={styles.navBody}>
          <div className={styles.mainItems}>
            {mainNavItems.map((item) => (
              <NavItemWithTooltip
                key={item.value}
                item={item}
                collapsed={collapsed}
                isActive={location.pathname === item.value}
                activeClass={styles.navItemActive}
                labelClass={labelClassName}
                onClick={() => navigate(item.value)}
              />
            ))}
          </div>
          <div className={styles.bottomSection}>
            <Divider />
            <NavItemWithTooltip
              item={settingsItem}
              collapsed={collapsed}
              isActive={location.pathname === "/settings"}
              activeClass={styles.navItemActive}
              labelClass={labelClassName}
              onClick={() => navigate("/settings")}
            />
          </div>
        </div>
      </NavDrawerBody>
      <NavDrawerFooter>
        <div className={collapseToggleClassName}>
          <Tooltip content={collapseTooltipContent} relationship="label" positioning="after">
            <Button
              appearance="subtle"
              size="small"
              icon={collapsed ? <ChevronRight24Regular /> : <ChevronLeft24Regular />}
              onClick={onToggleCollapse}
              className={styles.collapseButton}
            />
          </Tooltip>
        </div>
        <div className={footerClassName}>
          <Text size={100} className={footerTextClassName}>
            Supply Chain IQ
          </Text>
        </div>
      </NavDrawerFooter>
    </NavDrawer>
  );
}
