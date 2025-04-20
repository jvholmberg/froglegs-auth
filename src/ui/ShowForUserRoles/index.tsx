import { ReactNode } from "react";
import { IUser } from "@/lib/server/db/types";
import { Role } from "@/lib/types/role";

interface IProps {
  user: IUser;
  roles: Role[];
  children: ReactNode | ReactNode[];
}

export function ShowForUserRoles({
  user,
  roles,
  children,
}: IProps) {
  const allowed = user.role && roles.includes(user.role);
  if (allowed) {
    return (
      <>
      {children}</>
    );
  }
  return null;
}
