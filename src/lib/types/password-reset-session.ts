export interface TblPasswordResetSession {
  id: string;
  user_id: number;
  email: string;
  code: string;
  expires_at: Date;
  email_verified: boolean;
  two_factor_verified: boolean;
}
