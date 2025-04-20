/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { deleteUser, updateUserPassword, updateUserRole } from "@/lib/server/user";
import { IActionResult } from "@/lib/client/types";
import { 
  checkHasUserRole, 
  genericErrorResult, 
  genericForbiddenErrorResult, 
  genericSuccesResult 
} from "@/lib/server/utils";
import { getRole } from "@/lib/server/role";
import { getCurrentSession } from "@/lib/server/session";
import { Role } from "@/lib/types/role";

export async function deleteUserAction(userId: number): Promise<IActionResult> {
  const { user } = await getCurrentSession();
  if (!checkHasUserRole(["super_admin"], user)) {
    return genericForbiddenErrorResult();
  }

  const success = await deleteUser(userId);
  if (success) {
    return genericSuccesResult("Användaren togs bort", "");
  }
  return genericErrorResult("Användaren kunde inte tas bort")
}

export async function updateUserRoleAction(userId: number, roleSlug: Role | null): Promise<IActionResult> {
  const { user } = await getCurrentSession();
  if (!checkHasUserRole(["super_admin"], user)) {
    return genericForbiddenErrorResult();
  }

  const role = roleSlug 
    ? await getRole({ slug: roleSlug }) 
    : null;

  const success = await updateUserRole(userId, role?.id ?? null);
  if (success) {
    return genericSuccesResult("Användarens roll har uppdaterats", "");
  }
  return genericErrorResult("Det gick inte att uppdatera användarens roll");
}


export async function dangerouslySetUserPasswordAction(userId: number, password: string) {
  if (password.length < 6) {
    return genericErrorResult("Lösenordet måste vara minst 6 tecken långt");
  }
  
  const { user } = await getCurrentSession()
  if (!checkHasUserRole(["super_admin"], user)) {
    return genericForbiddenErrorResult();
  }

  const success = await updateUserPassword(userId, password);
  if (success) {
    return genericSuccesResult("Lösenordet har uppdaterats", "");
  }
  return genericErrorResult("Det gick inte att uppdatera användarens roll");
  
  
}
