
export interface TblUserApp {
  user_id: number;
  app_id: number;
  role_id: number | null;
  external_partition_id: number | null;
  external_organization_id: number | null;
  external_id: number | null;
}
