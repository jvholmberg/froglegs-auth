
export interface TblAppInvitation {
  id: number;
  app_id: number;
  external_partition_id: number | null;
  external_organization_id: number | null;
  email: string;
  role_id: number | null;
  expires_at: Date | null;
}
