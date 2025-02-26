/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { globalPOSTRateLimit } from "@/lib/server/request";
import { getCurrentSession, invalidateSession, deleteSessionTokenCookie } from "@/lib/server/session";
import { redirect } from "next/navigation";
import { ROUTE_SIGN_IN } from "@/lib/client/constants";
import { IActionResult } from "../types";

export async function signoutAction(): Promise<IActionResult> {
	if (!globalPOSTRateLimit()) {
		return {
			message: "Too many requests"
		};
	}
	const { session } = await getCurrentSession();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}
	await invalidateSession(session.id);
	await deleteSessionTokenCookie();
	return redirect(ROUTE_SIGN_IN);
}
