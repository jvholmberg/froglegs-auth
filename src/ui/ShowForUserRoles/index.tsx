import { IUser, UserRole } from "@/lib/server/db/types";
import { ReactNode } from "react";

interface Props {
  user: IUser;
  roles: UserRole[];
  children: ReactNode | ReactNode[];
}

export function ShowForUserRoles({
  user,
  roles,
  children,
}: Props) {
  const allowed = user.role && roles.includes(user.role);
  if (allowed) {
    return (
      <>
      {children}</>
    );
  }
  return null;
}
