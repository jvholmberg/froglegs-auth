import { ReactNode } from "react";
import { IUser, Role } from "@/lib/server/db/types";

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
        {children}
      </>
    );
  }
  return null;
}
