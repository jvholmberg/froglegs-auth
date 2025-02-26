/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { getCurrentSession } from "@/lib/server/session";
import { updateUserDetails } from "@/lib/server/user";
import { redirect } from "next/navigation";
import { IActionResult } from "../types";
import { IUpdateUserDetailsFormData, updateUserDetailsFormDataSchema } from "./schema";

export async function updateUserDetailsAction(formData: IUpdateUserDetailsFormData): Promise<IActionResult> {
  const { session, user } = await getCurrentSession();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}
  if (user === null) {
    return {
      message: "Inget konto kunde hittas"
    };
  }
  
  try {
    await updateUserDetailsFormDataSchema.parseAsync(formData);
  } catch {
    return {
      message: "Ogiltig data. Kontrollera att uppgifter är korrekta",
    };
  }

  await updateUserDetails(user.id, formData);
  return redirect("/");
}
