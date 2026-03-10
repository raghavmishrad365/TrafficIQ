import type { OpenAIToolDefinition } from "../../agentTools";
import { d365McpClient } from "../../d365McpClient";
import { sharedToolDefinitions, executeSharedTool, getNavigateCallback } from "./sharedTools";

// --- Auto-navigation: map tool names to the page they should open ---
const TOOL_PAGE_MAP: Record<string, string> = {
  get_work_orders: "/work-orders",
  assign_work_order: "/work-orders",
  get_technician_availability: "/scheduling",
  get_schedule_board: "/scheduling",
  optimize_schedule: "/scheduling",
  get_returns: "/returns",
  approve_return: "/returns",
};

// --- Tool Definitions ---

const operationsOnlyTools: OpenAIToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_work_orders",
      description: "Get work orders from Field Service. Can filter by status.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["unscheduled", "scheduled", "in_progress", "completed", "cancelled"], description: "Filter by work order status" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_technician_availability",
      description: "Get available field service technicians with skills and current assignments.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "assign_work_order",
      description: "Assign a work order to a technician. Validates skill requirements before assignment.",
      parameters: {
        type: "object",
        properties: {
          work_order_id: { type: "string", description: "The work order ID to assign" },
          technician_id: { type: "string", description: "The technician ID to assign to" },
        },
        required: ["work_order_id", "technician_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_schedule_board",
      description: "Get today's resource scheduling board showing technician assignments and time slots.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "optimize_schedule",
      description: "Suggest optimal work order assignment based on technician skills, location, and availability.",
      parameters: {
        type: "object",
        properties: {
          work_order_id: { type: "string", description: "The work order ID to find the best technician for" },
        },
        required: ["work_order_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_returns",
      description: "Get return orders for reverse logistics. Can filter by status.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["requested", "approved", "pickup_scheduled", "in_transit", "received", "processed", "rejected"], description: "Filter by return status" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "approve_return",
      description: "Approve a return request and schedule pickup.",
      parameters: {
        type: "object",
        properties: {
          return_id: { type: "string", description: "The return ID to approve" },
        },
        required: ["return_id"],
      },
    },
  },
];

export const operationsToolDefinitions: OpenAIToolDefinition[] = [
  ...operationsOnlyTools,
  ...sharedToolDefinitions,
];

// --- Tool Handlers ---

async function handleGetWorkOrders(args: { status?: string }): Promise<unknown> {
  const workOrders = await d365McpClient.getWorkOrders(args.status);
  return {
    workOrders: workOrders.map(wo => ({
      workOrderId: wo.workOrderId, customerName: wo.customerName, serviceType: wo.serviceType,
      priority: wo.priority, status: wo.status, location: wo.location.label,
      estimatedDuration: wo.estimatedDuration, scheduledDate: wo.scheduledDate || "Unscheduled",
      assignedTechnicianId: wo.assignedTechnicianId || "Unassigned", requiredSkills: wo.requiredSkills,
      description: wo.description,
    })),
    totalCount: workOrders.length,
    dataSource: d365McpClient.isConnected() ? "D365 Field Service" : "Demo Data",
  };
}

async function handleGetTechnicianAvailability(): Promise<unknown> {
  const technicians = await d365McpClient.getTechnicians();
  return {
    technicians: technicians.map(t => ({
      id: t.id, name: t.name, skills: t.skills, status: t.status,
      location: t.currentLocation.label, todayWorkOrders: t.todayWorkOrders, completedToday: t.completedToday,
    })),
    available: technicians.filter(t => t.status === "available").length,
    onJob: technicians.filter(t => t.status === "on_job").length,
    offDuty: technicians.filter(t => t.status === "off_duty").length,
    totalCount: technicians.length,
  };
}

async function handleAssignWorkOrder(args: { work_order_id: string; technician_id: string }): Promise<unknown> {
  const workOrders = await d365McpClient.getWorkOrders();
  const wo = workOrders.find(w => w.workOrderId === args.work_order_id || w.id === args.work_order_id);
  if (!wo) return { success: false, error: `Work order not found: ${args.work_order_id}` };
  const technicians = await d365McpClient.getTechnicians();
  const tech = technicians.find(t => t.id === args.technician_id);
  if (!tech) return { success: false, error: `Technician not found: ${args.technician_id}` };
  const missingSkills = wo.requiredSkills.filter(s => !tech.skills.includes(s));
  if (missingSkills.length > 0) return { success: false, error: `Technician ${tech.name} is missing required skills: ${missingSkills.join(", ")}`, technicianSkills: tech.skills, requiredSkills: wo.requiredSkills };
  const success = await d365McpClient.assignWorkOrder(wo.workOrderId, args.technician_id);
  return { success, workOrderId: wo.workOrderId, assignedTo: tech.name, technicianId: tech.id, message: success ? `Work order ${wo.workOrderId} assigned to ${tech.name}` : `Failed to assign work order` };
}

async function handleGetScheduleBoard(): Promise<unknown> {
  const board = await d365McpClient.getScheduleBoard();
  return {
    technicians: board.technicians.map(t => ({ id: t.id, name: t.name, skills: t.skills, status: t.status, location: t.currentLocation.label })),
    slots: board.slots.map(s => ({ workOrderId: s.workOrderId, technicianId: s.technicianId, startHour: s.startHour, durationHours: s.durationHours, priority: s.priority, customerName: s.customerName, serviceType: s.serviceType })),
    unscheduledWorkOrders: board.unscheduledWorkOrders.map(wo => ({ workOrderId: wo.workOrderId, customerName: wo.customerName, serviceType: wo.serviceType, priority: wo.priority, requiredSkills: wo.requiredSkills, estimatedDuration: wo.estimatedDuration, location: wo.location.label })),
    scheduledCount: board.slots.length,
    unscheduledCount: board.unscheduledWorkOrders.length,
    techniciansOnDuty: board.technicians.filter(t => t.status !== "off_duty").length,
    dataSource: d365McpClient.isConnected() ? "D365 Field Service" : "Demo Data",
  };
}

async function handleOptimizeSchedule(args: { work_order_id: string }): Promise<unknown> {
  const board = await d365McpClient.getScheduleBoard();
  const technicians = await d365McpClient.getTechnicians();
  const workOrders = await d365McpClient.getWorkOrders();
  const wo = workOrders.find(w => w.workOrderId === args.work_order_id || w.id === args.work_order_id);
  if (!wo) return { error: `Work order not found: ${args.work_order_id}` };
  const candidates = technicians.filter(t => t.status === "available" || t.status === "on_job").map(t => {
    const skillMatch = wo.requiredSkills.filter(s => t.skills.includes(s)).length;
    const skillTotal = wo.requiredSkills.length;
    const skillScore = skillTotal > 0 ? (skillMatch / skillTotal) * 100 : 100;
    const existingSlots = board.slots.filter(s => s.technicianId === t.id).length;
    const availabilityScore = Math.max(0, 100 - existingSlots * 25);
    const overallScore = Math.round(skillScore * 0.6 + availabilityScore * 0.4);
    return { technicianId: t.id, technicianName: t.name, skills: t.skills, matchingSkills: wo.requiredSkills.filter(s => t.skills.includes(s)), missingSkills: wo.requiredSkills.filter(s => !t.skills.includes(s)), skillScore: Math.round(skillScore), availabilityScore, overallScore, existingAssignments: existingSlots, location: t.currentLocation.label };
  }).sort((a, b) => b.overallScore - a.overallScore);
  return { workOrder: { id: wo.workOrderId, customerName: wo.customerName, requiredSkills: wo.requiredSkills, priority: wo.priority }, recommendations: candidates.slice(0, 3), bestMatch: candidates[0] || null, message: candidates.length > 0 ? `Best match: ${candidates[0].technicianName} (score: ${candidates[0].overallScore}%)` : "No available technicians with matching skills" };
}

async function handleGetReturns(args: { status?: string }): Promise<unknown> {
  const returns = await d365McpClient.getReturns(args.status);
  return {
    returns: returns.map(r => ({ returnId: r.returnId, originalShipmentId: r.originalShipmentId, customerName: r.customerName, reason: r.reason, status: r.status, items: r.items.map(i => ({ itemName: i.itemName, quantity: i.quantity, condition: i.condition })), requestedDate: r.requestedDate, pickupDate: r.pickupDate || "Not scheduled", refundAmount: r.refundAmount, warehouseId: r.warehouseId, notes: r.notes })),
    totalCount: returns.length,
    totalRefundAmount: returns.reduce((s, r) => s + r.refundAmount, 0),
    dataSource: d365McpClient.isConnected() ? "D365 F&O" : "Demo Data",
  };
}

async function handleApproveReturn(args: { return_id: string }): Promise<unknown> {
  const returns = await d365McpClient.getReturns();
  const ret = returns.find(r => r.returnId === args.return_id || r.id === args.return_id);
  if (!ret) return { success: false, error: `Return not found: ${args.return_id}` };
  if (ret.status !== "requested") return { success: false, error: `Return ${args.return_id} is in '${ret.status}' status, can only approve 'requested' returns` };
  const success = await d365McpClient.approveReturn(ret.returnId);
  return { success, returnId: ret.returnId, customerName: ret.customerName, message: success ? `Return ${ret.returnId} approved. Pickup will be scheduled.` : `Failed to approve return ${ret.returnId}` };
}

// --- Unified tool executor ---

export async function executeOperationsTool(name: string, argsJson: string): Promise<string> {
  const shared = await executeSharedTool(name, argsJson);
  if (shared !== null) return shared;

  const args = JSON.parse(argsJson || "{}");
  let result: unknown;
  switch (name) {
    case "get_work_orders": result = await handleGetWorkOrders(args); break;
    case "get_technician_availability": result = await handleGetTechnicianAvailability(); break;
    case "assign_work_order": result = await handleAssignWorkOrder(args); break;
    case "get_schedule_board": result = await handleGetScheduleBoard(); break;
    case "optimize_schedule": result = await handleOptimizeSchedule(args); break;
    case "get_returns": result = await handleGetReturns(args); break;
    case "approve_return": result = await handleApproveReturn(args); break;
    default: result = { error: `Unknown operations tool: ${name}` };
  }
  // Auto-navigate to the relevant page
  const targetPage = TOOL_PAGE_MAP[name];
  if (targetPage) {
    const nav = getNavigateCallback();
    if (nav) nav(targetPage);
  }
  return JSON.stringify(result);
}
