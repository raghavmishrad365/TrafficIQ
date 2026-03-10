// =============================================================================
// Shared Dataverse Service Types
// Reused across all generated CRUD services
// Publisher: TrafficIQ (tiq)
// =============================================================================

export interface IGetAllOptions {
  maxPageSize?: number;
  select?: string[];
  filter?: string;
  orderBy?: string[];
  top?: number;
  skip?: number;
  skipToken?: string;
}

export interface IOperationResult<T> {
  data: T;
  error?: string;
}
