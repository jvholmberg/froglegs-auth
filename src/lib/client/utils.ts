import { UserAppRole, UserRole } from "../server/user";

export function getRoleName(role: UserRole | UserAppRole | undefined | null) {
  switch (role) {
    case "super_admin":
      return "Super admin";
    case "admin":
      return "Admin";
    case "manager":
      return "Manager";
    case "user":
      return "Användare";
    case "guest":
      return "Gäst";
    default:
      return "-";
  }
}
