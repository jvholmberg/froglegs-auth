/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { getCurrentSession } from "@/lib/server/session";
import { IActionResult } from "@/lib/client/types";
import { acceptAppInvitation, createAppInvitation, declineAppInvitation } from "@/lib/server/app";
import {
  genericErrorResult,
  genericForbiddenErrorResult,
  genericNoAccountErrorResult,
  genericNotLoggedInErrorResult,
  genericSuccesResult,
  genericValidationErrorResult,
} from "@/lib/server/utils";
import {
  acceptAppInvitationFormDataSchema,
  createAppInvitationFormDataSchema,
  declineAppInvitationFormDataSchema,
  IAcceptAppInvitationFormData,
  ICreateAppInvitationFormData,
  IDeclineAppInvitationFormData,
} from "./schema";

export async function createAppInvitationAction(formData: ICreateAppInvitationFormData): Promise<IActionResult> {
  // Make sure user is logged in
  const { session, user } = await getCurrentSession();
  if (session === null) { return genericNotLoggedInErrorResult(); }
  if (user === null) { return genericNoAccountErrorResult(); }
  if (!user.emailVerified) { return genericForbiddenErrorResult(); }
  if (user.registered2FA && !session.twoFactorVerified) { return genericForbiddenErrorResult(); }
  
  // Do some initial validation of data
  try { await createAppInvitationFormDataSchema.parseAsync(formData); }
  catch { return genericValidationErrorResult(); }

  const success = await createAppInvitation(
    formData.appSlug,
    formData.email,
    formData.roleSlug,
    formData.partitionId,
    formData.organizationId,
  );

  if (success) { return genericSuccesResult(null, "Inbjudan skapades"); }
  return genericErrorResult();
}

export async function acceptAppInvitationAction(formData: IAcceptAppInvitationFormData): Promise<IActionResult> {
  // Make sure user is logged in
  const { session, user } = await getCurrentSession();
  if (session === null) { return genericNotLoggedInErrorResult(); }
  if (user === null) { return genericNoAccountErrorResult(); }
  if (!user.emailVerified) { return genericForbiddenErrorResult(); }
  if (user.registered2FA && !session.twoFactorVerified) { return genericForbiddenErrorResult(); }
  
  // Do some initial validation of data
  try { await acceptAppInvitationFormDataSchema.parseAsync(formData); }
  catch { return genericValidationErrorResult(); }

  const success = await acceptAppInvitation(formData.id, user!);

  if (success) { return genericSuccesResult(null, "Inbjudan accepterades"); }
  return genericErrorResult();
}

export async function declineAppInvitationAction(formData: IDeclineAppInvitationFormData): Promise<IActionResult> {
  // Make sure user is logged in
  const { session, user } = await getCurrentSession();
  if (session === null) { return genericNotLoggedInErrorResult(); }
  if (user === null) { return genericNoAccountErrorResult(); }
  if (!user.emailVerified) { return genericForbiddenErrorResult(); }
  if (user.registered2FA && !session.twoFactorVerified) { return genericForbiddenErrorResult(); }
  
  // Do some initial validation of data
  try { await declineAppInvitationFormDataSchema.parseAsync(formData); }
  catch { return genericValidationErrorResult(); }

  await declineAppInvitation(formData.id, user!);
  return genericSuccesResult(null, "Inbjudan togs bort");
}
