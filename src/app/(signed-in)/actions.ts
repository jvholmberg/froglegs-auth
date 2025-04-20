/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { globalPOSTRateLimit } from "@/lib/server/request";
import { getCurrentSession, invalidateSession, deleteSessionTokenCookie } from "@/lib/server/session";
import { redirect } from "next/navigation";
import { ROUTE_SIGN_IN } from "@/lib/client/constants";
import { IActionResult } from "@/lib/client/types";
import { genericNotLoggedInErrorResult, genericTooManyRequestsResult } from "@/lib/server/utils";

export async function signoutAction(): Promise<IActionResult> {
	if (!globalPOSTRateLimit()) {
    return genericTooManyRequestsResult();
	}
	const { session } = await getCurrentSession();
	if (session === null) {
		return genericNotLoggedInErrorResult();
	}
	await invalidateSession(session.id);
	await deleteSessionTokenCookie();
	return redirect(ROUTE_SIGN_IN);
}
