import { Role } from "@/lib/types/role";

export function getRoleName(role: Role | undefined | null) {
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
