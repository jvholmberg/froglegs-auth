
export interface TblEmailVerificationRequest {
  id: string;
  user_id: number;
  email: string;
  code: string;
  expires_at: Date;
}
