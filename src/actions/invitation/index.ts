/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { getCurrentSession } from "@/lib/server/session";
import { IActionResultExtended } from "../types";
import { acceptAppInvitationFormDataSchema, createAppInvitationFormDataSchema, declineAppInvitationFormDataSchema, IAcceptAppInvitationFormData, ICreateAppInvitationFormData, IDeclineAppInvitationFormData } from "./schema";
import { ERR_NO_ACCOUNT, ERR_NOT_SIGNED_IN, ERR_VALIDATION } from "@/lib/server/constants";
import { acceptAppInvitation, createAppInvitation, declineAppInvitation } from "@/lib/server/app";

export async function createAppInvitationAction(formData: ICreateAppInvitationFormData): Promise<IActionResultExtended> {
  const { session, user } = await getCurrentSession();
	if (session === null) {
		return {
      error: new Error(),
      notification: {
        color: "red",
        title: "Fel",
        message: ERR_NOT_SIGNED_IN,
      }
		};
	}
  if (user === null) {
    return {
      error: new Error(),
      notification: {
        color: "red",
        title: "Fel",
        message: ERR_NO_ACCOUNT,
      }
		};
  }
  
  try {
    await createAppInvitationFormDataSchema.parseAsync(formData);
  } catch {
    return {
      error: new Error(),
      notification: {
        color: "red",
        title: "Fel",
        message: ERR_VALIDATION,
      }
		};
  }
  const success = await createAppInvitation(
    formData.appId,
    formData.email,
    formData.role,
    formData.organizationId,
  );
  if (success) {
    return {
      error: new Error(),
      notification: {
        color: "green",
        title: "Allt gick bra",
        message: "Inbjudan accepterades",
      }
		};
  } else {
    return {
      error: new Error(),
      notification: {
        color: "red",
        title: "Fel",
        message: "Något gick fel",
      }
		};
  }
}

export async function acceptAppInvitationAction(formData: IAcceptAppInvitationFormData): Promise<IActionResultExtended> {
  const { session, user } = await getCurrentSession();
	if (session === null) {
		return {
      error: new Error(),
      notification: {
        color: "red",
        title: "Fel",
        message: ERR_NOT_SIGNED_IN,
      }
		};
	}
  if (user === null) {
    return {
      error: new Error(),
      notification: {
        color: "red",
        title: "Fel",
        message: ERR_NO_ACCOUNT,
      }
		};
  }
  
  try {
    await acceptAppInvitationFormDataSchema.parseAsync(formData);
  } catch {
    return {
      error: new Error(),
      notification: {
        color: "red",
        title: "Fel",
        message: ERR_VALIDATION,
      }
		};
  }
  const { id } = formData;
  const success = await acceptAppInvitation(id, user);
  if (success) {
    return {
      error: new Error(),
      notification: {
        color: "green",
        title: "Allt gick bra",
        message: "Inbjudan accepterades",
      }
		};
  } else {
    return {
      error: new Error(),
      notification: {
        color: "red",
        title: "Fel",
        message: "Något gick fel",
      }
		};
  }
}

export async function declineAppInvitationAction(formData: IDeclineAppInvitationFormData): Promise<IActionResultExtended> {
  const { session, user } = await getCurrentSession();
	if (session === null) {
		return {
      error: new Error(),
      notification: {
        color: "red",
        title: "Fel",
        message: ERR_NOT_SIGNED_IN,
      }
		};
	}
  if (user === null) {
    return {
      error: new Error(),
      notification: {
        color: "red",
        title: "Fel",
        message: ERR_NO_ACCOUNT,
      }
		};
  }
  
  try {
    await declineAppInvitationFormDataSchema.parseAsync(formData);
  } catch {
    return {
      error: new Error(),
      notification: {
        color: "red",
        title: "Fel",
        message: ERR_VALIDATION,
      }
		};
  }
  const { id } = formData;
  await declineAppInvitation(id, user);
  return {
    error: new Error(),
    notification: {
      color: "green",
      title: "Inbjudan togs bort",
      message: "",
    }
  };
}
