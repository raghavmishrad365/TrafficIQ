// Generated models barrel export — TrafficIQ (tiq_) Dataverse tables

// Traffic & Journey
export type { TrafficIncidentEntity } from "./TrafficIncidentModel";
export { IncidentTypeOption, SeverityOption, DataSourceOption } from "./TrafficIncidentModel";

export type { SavedJourneyEntity } from "./SavedJourneyModel";
export { TransportModeOption } from "./SavedJourneyModel";

export type { NotificationEntity } from "./NotificationModel";
export { NotificationTypeOption, NotificationSeverityOption } from "./NotificationModel";

export type { UserPreferenceEntity } from "./UserPreferenceModel";
export { ThemeModeOption } from "./UserPreferenceModel";

export type { RouteOptionRecord } from "./RouteOptionModel";

export type { RouteStepRecord } from "./RouteStepModel";

export type { ChatThreadRecord } from "./ChatThreadModel";
export { AgentDomainOption } from "./ChatThreadModel";

export type { ChatMessageRecord } from "./ChatMessageModel";
export { ChatRole, ChatRoleLabels } from "./ChatMessageModel";

export type { TrafficSummaryRecord } from "./TrafficSummaryModel";
export { CongestionLevel, CongestionLevelLabels } from "./TrafficSummaryModel";

// Supply Chain
export type { ShipmentEntity } from "./ShipmentModel";
export { ShipmentStatusOption, ShipmentPriorityOption } from "./ShipmentModel";

export type { WarehouseEntity } from "./WarehouseModel";

export type { InventoryItemEntity } from "./InventoryItemModel";

export type { DeliveryRouteEntity } from "./DeliveryRouteModel";

export type { ReturnOrderEntity } from "./ReturnOrderModel";
export { ReturnReasonOption, ReturnStatusOption } from "./ReturnOrderModel";

// Fleet & Maintenance
export type { FleetVehicleEntity } from "./FleetVehicleModel";
export { VehicleStatusOption } from "./FleetVehicleModel";

export type { VehicleHealthEntity } from "./VehicleHealthModel";

export type { MaintenanceAlertEntity } from "./MaintenanceAlertModel";
export { MaintenanceComponentOption, AlertSeverityOption } from "./MaintenanceAlertModel";

export type { MaintenanceRecordEntity } from "./MaintenanceRecordModel";

// Work Orders & Field Service
export type { WorkOrderEntity } from "./WorkOrderModel";
export { WorkOrderPriorityOption, WorkOrderStatusOption } from "./WorkOrderModel";

export type { TechnicianEntity } from "./TechnicianModel";
export { TechnicianStatusOption } from "./TechnicianModel";

export type { ServiceRequestEntity } from "./ServiceRequestModel";
export { ServiceRequestPriorityOption, ServiceRequestStatusOption, SLAStatusOption } from "./ServiceRequestModel";

export type { CustomerAssetEntity } from "./CustomerAssetModel";
export { WarrantyStatusOption, AssetOperationalStatusOption } from "./CustomerAssetModel";

export type { ServiceAgreementEntity } from "./ServiceAgreementModel";
export { ContractTypeOption, AgreementStatusOption } from "./ServiceAgreementModel";

// IoT
export type { IoTDeviceEntity } from "./IoTDeviceModel";
export { IoTDeviceStatusOption } from "./IoTDeviceModel";

export type { GeofenceZoneEntity } from "./GeofenceZoneModel";

export type { GeofenceEventEntity } from "./GeofenceEventModel";
export { GeofenceEventTypeOption } from "./GeofenceEventModel";

export type { DrivingAlertEntity } from "./DrivingAlertModel";
export { DrivingAlertTypeOption } from "./DrivingAlertModel";

export type { ConnectivityAlertEntity } from "./ConnectivityAlertModel";
export { ConnectivityAlertTypeOption } from "./ConnectivityAlertModel";

// Settings
export type { AppSettingEntity } from "./AppSettingModel";
export { SettingCategoryOption } from "./AppSettingModel";

export type { AgentConfigurationEntity } from "./AgentConfigurationModel";

// Analytics
export type { SupplyChainKPIEntity } from "./SupplyChainKPIModel";
