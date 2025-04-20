import { IUser } from "@/lib/server/db/types";
import { Role } from "@/lib/types/role";
import { ReactNode } from "react";

interface IProps {
  user: IUser;
  appId: number;
  roles: Role[];
  children: ReactNode | ReactNode[];
}

export function ShowForUserAppRoles({
  user,
  appId,
  roles,
  children,
}: IProps) {
  const userApp = user.apps.find((e) => e.appId === appId);
  const allowed = userApp?.role && roles.includes(userApp.role);
  if (allowed) {
    return (
      <>
      {children}</>
    );
  }
  return null;
}
