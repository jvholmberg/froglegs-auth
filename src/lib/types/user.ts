
export interface TblUser {
  id: number;
  email: string;
  password_hash: string;
  email_verified: boolean;
  totp_key: Uint8Array | null;
  recovery_code: Uint8Array;
  role_id: number | null;
}
