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
  Divider,
} from "@fluentui/react-components";
import {
  CalendarLtr24Regular,
  Person24Regular,
  Wrench24Regular,
  Clock24Regular,
} from "@fluentui/react-icons";
import { d365McpClient } from "../services/d365McpClient";
import type { Technician, ScheduleSlot, WorkOrder } from "../types/supplychain";

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 06:00–20:00

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
  statIconScheduled: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  statIconUnscheduled: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
  },
  statIconOnDuty: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  statIconUtil: {
    backgroundColor: tokens.colorPaletteBlueBackground2,
    color: tokens.colorPaletteBlueForeground2,
  },
  statInfo: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  boardLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 280px",
    gap: tokens.spacingHorizontalL,
    "@media (max-width: 960px)": {
      gridTemplateColumns: "1fr",
    },
  },
  boardWrapper: {
    overflowX: "auto",
  },
  board: {
    display: "flex",
    flexDirection: "column",
    minWidth: "900px",
  },
  timeHeader: {
    display: "grid",
    gridTemplateColumns: "140px repeat(15, 1fr)",
    gap: "1px",
    marginBottom: tokens.spacingVerticalXS,
  },
  timeCell: {
    textAlign: "center",
    ...shorthands.padding(tokens.spacingVerticalXS),
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  techRow: {
    display: "grid",
    gridTemplateColumns: "140px repeat(15, 1fr)",
    gap: "1px",
    marginBottom: "2px",
    minHeight: "48px",
    position: "relative",
  },
  techLabel: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    ...shorthands.padding(tokens.spacingVerticalXS),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold as unknown as number,
  },
  hourCell: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    minHeight: "44px",
  },
  slotBlock: {
    position: "absolute",
    top: "2px",
    height: "40px",
    borderRadius: tokens.borderRadiusMedium,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold as unknown as number,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    ...shorthands.padding("0", tokens.spacingHorizontalXS),
    cursor: "default",
    zIndex: 1,
  },
  priorityCritical: { backgroundColor: tokens.colorPaletteRedBackground3 },
  priorityHigh: { backgroundColor: tokens.colorPaletteDarkOrangeBackground3 },
  priorityMedium: { backgroundColor: tokens.colorBrandBackground },
  priorityLow: { backgroundColor: tokens.colorNeutralBackground5, color: tokens.colorNeutralForeground2 },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  unschedCard: {
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    borderLeft: `3px solid ${tokens.colorPaletteYellowBorder2}`,
  },
  badgeRow: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
    alignItems: "center",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    ...shorthands.padding(tokens.spacingVerticalXXL),
  },
});

function getPriorityClass(styles: ReturnType<typeof useStyles>, priority: string) {
  switch (priority) {
    case "critical": return styles.priorityCritical;
    case "high": return styles.priorityHigh;
    case "medium": return styles.priorityMedium;
    default: return styles.priorityLow;
  }
}

export function SchedulingBoardPage() {
  const styles = useStyles();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [unscheduled, setUnscheduled] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    d365McpClient.initialize();
    d365McpClient.getScheduleBoard().then((board) => {
      setTechnicians(board.technicians);
      setSlots(board.slots);
      setUnscheduled(board.unscheduledWorkOrders);
      setIsLoading(false);
    });
  }, []);

  const onDutyCount = technicians.filter((t) => t.status !== "off_duty").length;
  const utilPct = technicians.length > 0 ? Math.round((slots.length / (technicians.length * 8)) * 100) : 0;

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.pageHeader}>
          <Text size={600} weight="semibold">Resource Scheduling Board</Text>
          <Text size={200}>Technician dispatch timeline and work order assignments</Text>
        </div>
        <div className={styles.loadingContainer}><Spinner label="Loading schedule..." /></div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <Text size={600} weight="semibold">Resource Scheduling Board</Text>
        <Text size={200}>Technician dispatch timeline and work order assignments</Text>
      </div>

      <div className={styles.statsRow}>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconScheduled}`}><CalendarLtr24Regular /></div>
          <div className={styles.statInfo}>
            <Text size={200}>Scheduled</Text>
            <CounterBadge count={slots.length} color="brand" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconUnscheduled}`}><Clock24Regular /></div>
          <div className={styles.statInfo}>
            <Text size={200}>Unscheduled</Text>
            <CounterBadge count={unscheduled.length} color="danger" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconOnDuty}`}><Person24Regular /></div>
          <div className={styles.statInfo}>
            <Text size={200}>Technicians On Duty</Text>
            <CounterBadge count={onDutyCount} color="brand" appearance="filled" size="large" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconUtil}`}><Wrench24Regular /></div>
          <div className={styles.statInfo}>
            <Text size={200}>Utilization</Text>
            <Text size={500} weight="semibold">{utilPct}%</Text>
          </div>
        </Card>
      </div>

      <div className={styles.boardLayout}>
        <div className={styles.boardWrapper}>
          <div className={styles.board}>
            {/* Hour header */}
            <div className={styles.timeHeader}>
              <div className={styles.timeCell}>Technician</div>
              {HOURS.map((h) => (
                <div key={h} className={styles.timeCell}>{`${h.toString().padStart(2, "0")}:00`}</div>
              ))}
            </div>

            {/* Technician rows */}
            {technicians.filter((t) => t.status !== "off_duty").map((tech) => {
              const techSlots = slots.filter((s) => s.technicianId === tech.id);
              return (
                <div key={tech.id} className={styles.techRow}>
                  <div className={styles.techLabel}>
                    <Person24Regular />
                    <Text size={200}>{tech.name}</Text>
                  </div>
                  {HOURS.map((h) => (
                    <div key={h} className={styles.hourCell} />
                  ))}
                  {/* Slot blocks overlaid */}
                  {techSlots.map((slot) => {
                    const startCol = slot.startHour - 6 + 2; // +2 for label col offset (1-based grid)
                    const span = Math.max(1, Math.round(slot.durationHours));
                    const leftPct = `calc(${((startCol - 1) / 16) * 100}% + 1px)`;
                    const widthPct = `calc(${(span / 16) * 100}% - 2px)`;
                    return (
                      <div
                        key={slot.workOrderId}
                        className={`${styles.slotBlock} ${getPriorityClass(styles, slot.priority)}`}
                        style={{ left: leftPct, width: widthPct }}
                        title={`${slot.workOrderId}: ${slot.customerName} — ${slot.serviceType} (${slot.durationHours}h)`}
                      >
                        {slot.workOrderId}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Unscheduled work orders sidebar */}
        <div className={styles.sidebar}>
          <Text weight="semibold" size={400}>Unscheduled Work Orders</Text>
          <Divider />
          {unscheduled.length === 0 && (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>All work orders are scheduled</Text>
          )}
          {unscheduled.map((wo) => (
            <Card key={wo.id} className={styles.unschedCard}>
              <div className={styles.badgeRow}>
                <Text weight="semibold" size={300}>{wo.workOrderId}</Text>
                <Badge
                  appearance="filled"
                  color={wo.priority === "critical" ? "danger" : wo.priority === "high" ? "warning" : "informative"}
                  size="small"
                >
                  {wo.priority}
                </Badge>
              </div>
              <Text size={200}>{wo.customerName}</Text>
              <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                {wo.serviceType} — {wo.estimatedDuration} min
              </Text>
              <div className={styles.badgeRow}>
                {wo.requiredSkills.map((s) => (
                  <Badge key={s} appearance="tint" size="small">{s}</Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
