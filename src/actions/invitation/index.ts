/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { getCurrentSession } from "@/lib/server/session";
import { IActionResultExtended } from "../types";
import { acceptAppInvitationFormDataSchema, createAppInvitationFormDataSchema, declineAppInvitationFormDataSchema, IAcceptAppInvitationFormData, ICreateAppInvitationFormData, IDeclineAppInvitationFormData } from "./schema";
import { acceptAppInvitation, createAppInvitation, declineAppInvitation } from "@/lib/server/app";
import { checkSignedIn, genericErrorResult, genericSuccesResult, genericValidationErrorResult } from "@/lib/server/utils";

export async function createAppInvitationAction(formData: ICreateAppInvitationFormData): Promise<IActionResultExtended> {
  // Make sure user is logged in
  const unauthorized = await checkSignedIn();
  if (unauthorized) { return unauthorized; }
  
  // Do some initial validation of data
  try { await createAppInvitationFormDataSchema.parseAsync(formData); }
  catch { return genericValidationErrorResult(); }

  const success = await createAppInvitation(
    formData.appId,
    formData.email,
    formData.role,
    formData.organizationId,
  );

  if (success) { return genericSuccesResult("Inbjudan skapades"); }
  return genericErrorResult();
}

export async function acceptAppInvitationAction(formData: IAcceptAppInvitationFormData): Promise<IActionResultExtended> {
  // Make sure user is logged in
  const unauthorized = await checkSignedIn();
  if (unauthorized) { return unauthorized; }
  
  // Do some initial validation of data
  try { await acceptAppInvitationFormDataSchema.parseAsync(formData); }
  catch { return genericValidationErrorResult(); }

  // TODO: We should ideally not fetch user here again.
  // Instead we should return the one used when determining if signed in or not
  const { user } = await getCurrentSession();
  const success = await acceptAppInvitation(formData.id, user!);

  if (success) { return genericSuccesResult("Inbjudan accepterades"); }
  return genericErrorResult();
}

export async function declineAppInvitationAction(formData: IDeclineAppInvitationFormData): Promise<IActionResultExtended> {
  // Make sure user is logged in
  const unauthorized = await checkSignedIn();
  if (unauthorized) { return unauthorized; }
  
  // Do some initial validation of data
  try { await declineAppInvitationFormDataSchema.parseAsync(formData); }
  catch { return genericValidationErrorResult(); }

  // TODO: We should ideally not fetch user here again.
  // Instead we should return the one used when determining if signed in or not
  const { user } = await getCurrentSession();
  await declineAppInvitation(formData.id, user!);
  return genericSuccesResult("Inbjudan togs bort");
}
