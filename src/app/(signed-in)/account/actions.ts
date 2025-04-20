/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { getCurrentSession } from "@/lib/server/session";
import { updateUserDetails } from "@/lib/server/user";
import { IActionResult } from "@/lib/client/types";
import { genericErrorResult, genericForbiddenErrorResult, genericNoAccountErrorResult, genericNotLoggedInErrorResult, genericSuccesResult, genericValidationErrorResult } from "@/lib/server/utils";
import { IUpdateUserDetailsFormData, updateUserDetailsFormDataSchema } from "./schema";

export async function updateUserDetailsAction(formData: IUpdateUserDetailsFormData): Promise<IActionResult> {
  // Make sure user is logged in
  const { session, user } = await getCurrentSession();
  if (session === null) { return genericNotLoggedInErrorResult(); }
  if (user === null) { return genericNoAccountErrorResult(); }
  if (!user.emailVerified) { return genericForbiddenErrorResult(); }
  if (user.registered2FA && !session.twoFactorVerified) { return genericForbiddenErrorResult(); }
  
  // Do some initial validation of data
  try { await updateUserDetailsFormDataSchema.parseAsync(formData); }
  catch { return genericValidationErrorResult(); }
  
  const success = await updateUserDetails(user!.id, formData);

  if (success) { return genericSuccesResult(null, "Ditt konto har uppdaterats"); }
  return genericErrorResult();
}
