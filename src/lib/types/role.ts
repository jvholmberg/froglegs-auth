
export type Role = "super_admin" | "admin" | "manager" | "user" | "guest";

export interface TblRole {
  id: number;
  slug: string;
  rank: number;
  name: string;
  short_description: string;
  description: string;
}
