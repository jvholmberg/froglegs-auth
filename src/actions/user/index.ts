/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { getCurrentSession } from "@/lib/server/session";
import { updateUserDetails } from "@/lib/server/user";
import { IActionResultExtended } from "../types";
import { IUpdateUserDetailsFormData, updateUserDetailsFormDataSchema } from "./schema";
import { checkSignedIn, genericErrorResult, genericSuccesResult, genericValidationErrorResult } from "@/lib/server/utils";

export async function updateUserDetailsAction(formData: IUpdateUserDetailsFormData): Promise<IActionResultExtended> {
  // Make sure user is logged in
  const unauthorized = await checkSignedIn();
  if (unauthorized) { return unauthorized; }
  
  // Do some initial validation of data
  try { await updateUserDetailsFormDataSchema.parseAsync(formData); }
  catch { return genericValidationErrorResult(); }

  // TODO: We should ideally not fetch user here again.
  // Instead we should return the one used when determining if signed in or not
  const { user } = await getCurrentSession();
  const success = await updateUserDetails(user!.id, formData);

  if (success) { return genericSuccesResult("Ditt konto har uppdaterats"); }
  return genericErrorResult();
}
