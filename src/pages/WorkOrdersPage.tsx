import { useState, useEffect } from "react";
import {
  makeStyles,
  shorthands,
  tokens,
  Text,
  Card,
  Badge,
  CounterBadge,
  Spinner,
  TabList,
  Tab,
  Divider,
} from "@fluentui/react-components";
import {
  Wrench24Regular,
  Clock24Regular,
  Checkmark24Regular,
  Warning24Regular,
  Person24Regular,
} from "@fluentui/react-icons";
import { d365McpClient } from "../services/d365McpClient";
import type { WorkOrder, WorkOrderStatus, Technician } from "../types/supplychain";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  pageHeader: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    borderTop: "3px solid",
    borderImage: `linear-gradient(90deg, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundPressed}) 1`,
    ...shorthands.padding(tokens.spacingVerticalM, "0"),
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: tokens.spacingHorizontalL,
  },
  statCard: {
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.padding(tokens.spacingVerticalM),
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    transitionProperty: "box-shadow",
    transitionDuration: "200ms",
    ":hover": { boxShadow: tokens.shadow4 },
  },
  statIconBox: {
    width: "40px",
    height: "40px",
    borderRadius: tokens.borderRadiusMedium,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statIconTotal: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  statIconOpen: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
  },
  statIconProgress: {
    backgroundColor: tokens.colorPaletteBlueBackground2,
    color: tokens.colorPaletteBlueForeground2,
  },
  statIconDone: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  statInfo: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  contentLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: tokens.spacingHorizontalL,
    "@media (max-width: 960px)": {
      gridTemplateColumns: "1fr",
    },
  },
  workOrderList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  woCard: {
    borderRadius: tokens.borderRadiusXLarge,
    transitionProperty: "box-shadow",
    transitionDuration: "200ms",
    ":hover": { boxShadow: tokens.shadow4 },
  },
  woCardContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    ...shorthands.padding(tokens.spacingVerticalM),
  },
  woHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  woHeaderLeft: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  badgeRow: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
    alignItems: "center",
  },
  skillBadge: {
    fontSize: tokens.fontSizeBase100,
  },
  woMeta: {
    display: "flex",
    gap: tokens.spacingHorizontalL,
    flexWrap: "wrap",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
    color: tokens.colorNeutralForeground3,
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  techCard: {
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  techHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    ...shorthands.padding(tokens.spacingVerticalXXL),
  },
});

function getStatusBadge(status: WorkOrderStatus): { color: "warning" | "brand" | "informative" | "success" | "danger"; label: string } {
  switch (status) {
    case "unscheduled": return { color: "warning", label: "Unscheduled" };
    case "scheduled": return { color: "informative", label: "Scheduled" };
    case "in_progress": return { color: "brand", label: "In Progress" };
    case "completed": return { color: "success", label: "Completed" };
    case "cancelled": return { color: "danger", label: "Cancelled" };
  }
}

function getPriorityBadge(priority: WorkOrder["priority"]): { color: "danger" | "warning" | "informative" | "success"; label: string } {
  switch (priority) {
    case "critical": return { color: "danger", label: "Critical" };
    case "high": return { color: "warning", label: "High" };
    case "medium": return { color: "informative", label: "Medium" };
    case "low": return { color: "success", label: "Low" };
  }
}

function getTechStatusBadge(status: Technician["status"]): { color: "success" | "brand" | "danger"; label: string } {
  switch (status) {
    case "available": return { color: "success", label: "Available" };
    case "on_job": return { color: "brand", label: "On Job" };
    case "off_duty": return { color: "danger", label: "Off Duty" };
  }
}

type WOFilter = "all" | WorkOrderStatus;

export function WorkOrdersPage() {
  const styles = useStyles();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<WOFilter>("all");

  useEffect(() => {
    d365McpClient.initialize();
    Promise.all([
      d365McpClient.getWorkOrders(),
      d365McpClient.getTechnicians(),
    ]).then(([wos, techs]) => {
      setWorkOrders(wos);
      setTechnicians(techs);
      setIsLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? workOrders : workOrders.filter((wo) => wo.status === filter);
  const unscheduledCount = workOrders.filter((wo) => wo.status === "unscheduled").length;
  const inProgressCount = workOrders.filter((wo) => wo.status === "in_progress").length;
  const completedCount = workOrders.filter((wo) => wo.status === "completed").length;

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.pageHeader}>
          <Text size={600} weight="semibold">Work Orders</Text>
          <Text size={200}>Field service scheduling and work order management</Text>
        </div>
        <div className={styles.loadingContainer}>
          <Spinner label="Loading work orders..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <Text size={600} weight="semibold">
          Work Orders
        </Text>
        <Text size={200}>Field service scheduling and work order management</Text>
      </div>

      <div className={styles.statsRow}>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconTotal}`}>
            <Wrench24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Total Orders</Text>
            <CounterBadge count={workOrders.length} color="brand" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconOpen}`}>
            <Warning24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Unscheduled</Text>
            <CounterBadge count={unscheduledCount} color="danger" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconProgress}`}>
            <Clock24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>In Progress</Text>
            <CounterBadge count={inProgressCount} color="informative" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconDone}`}>
            <Checkmark24Regular />
          </div>
          <div className={styles.statInfo}>
            <Text size={200}>Completed</Text>
            <CounterBadge count={completedCount} color="brand" appearance="filled" size="large" />
          </div>
        </Card>
      </div>

      <TabList
        selectedValue={filter}
        onTabSelect={(_, data) => setFilter(data.value as WOFilter)}
      >
        <Tab value="all">All</Tab>
        <Tab value="unscheduled">Unscheduled</Tab>
        <Tab value="scheduled">Scheduled</Tab>
        <Tab value="in_progress">In Progress</Tab>
        <Tab value="completed">Completed</Tab>
      </TabList>

      <div className={styles.contentLayout}>
        <div className={styles.workOrderList}>
          {filtered.map((wo) => {
            const statusBadge = getStatusBadge(wo.status);
            const priorityBadge = getPriorityBadge(wo.priority);
            const tech = technicians.find((t) => t.id === wo.assignedTechnicianId);
            return (
              <Card key={wo.id} className={styles.woCard}>
                <div className={styles.woCardContent}>
                  <div className={styles.woHeader}>
                    <div className={styles.woHeaderLeft}>
                      <Text weight="semibold" size={400}>
                        {wo.workOrderId}
                      </Text>
                      <Text size={200}>{wo.customerName}</Text>
                    </div>
                    <div className={styles.badgeRow}>
                      <Badge appearance="filled" color={statusBadge.color} size="medium">
                        {statusBadge.label}
                      </Badge>
                      <Badge appearance="outline" color={priorityBadge.color} size="medium">
                        {priorityBadge.label}
                      </Badge>
                    </div>
                  </div>

                  <Text size={200}>{wo.description}</Text>

                  <div className={styles.badgeRow}>
                    {wo.requiredSkills.map((skill) => (
                      <Badge key={skill} appearance="tint" size="small" className={styles.skillBadge}>
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className={styles.woMeta}>
                    <div className={styles.metaItem}>
                      <Wrench24Regular />
                      <Text size={200}>{wo.serviceType}</Text>
                    </div>
                    <div className={styles.metaItem}>
                      <Clock24Regular />
                      <Text size={200}>{wo.estimatedDuration} min</Text>
                    </div>
                    <div className={styles.metaItem}>
                      <Person24Regular />
                      <Text size={200}>{tech ? tech.name : "Unassigned"}</Text>
                    </div>
                  </div>

                  <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                    {wo.location.label} — {wo.scheduledDate || "Not scheduled"}
                  </Text>
                </div>
              </Card>
            );
          })}
        </div>

        <div className={styles.sidebar}>
          <Text weight="semibold" size={400}>
            Technicians
          </Text>
          <Divider />
          {technicians.map((tech) => {
            const badge = getTechStatusBadge(tech.status);
            return (
              <Card key={tech.id} className={styles.techCard}>
                <div className={styles.techHeader}>
                  <Text weight="semibold" size={300}>{tech.name}</Text>
                  <Badge appearance="filled" color={badge.color} size="small">
                    {badge.label}
                  </Badge>
                </div>
                <div className={styles.badgeRow}>
                  {tech.skills.map((skill) => (
                    <Badge key={skill} appearance="tint" size="small" className={styles.skillBadge}>
                      {skill}
                    </Badge>
                  ))}
                </div>
                <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                  {tech.currentLocation.label} — {tech.completedToday}/{tech.todayWorkOrders} WOs today
                </Text>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
