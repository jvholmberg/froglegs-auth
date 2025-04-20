export interface TblSession {
  id: string;
  user_id: number;
  expires_at: Date;
  ip_number: string;
  two_factor_verified: boolean;
}
