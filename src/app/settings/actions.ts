/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { globalPOSTRateLimit } from "@/lib/server/request";
import { getCurrentSession } from "@/lib/server/session";
import {
  genericTooManyRequestsResult,
  genericNotLoggedInErrorResult,
  genericForbiddenErrorResult,
  genericSuccesResult,
} from "@/lib/server/utils";
import { IActionResult } from "@/lib/client/types";
import { TWO_FACTOR_MANDATORY } from "@/lib/client/constants";
import { ExpiringTokenBucket } from "@/lib/server/rate-limit";
import { remove2FAFromSignedInUser } from "@/lib/server/2fa";

const bucket = new ExpiringTokenBucket<number>(5, 60 * 30);

export async function remove2FAAction(): Promise<IActionResult> {
  const belowRateLimit = await globalPOSTRateLimit();
  if (!belowRateLimit) {
    return genericTooManyRequestsResult();
  }

  if (TWO_FACTOR_MANDATORY) {
    return genericForbiddenErrorResult();
  }

  const { session, user } = await getCurrentSession();
  if (session === null) {
    return genericNotLoggedInErrorResult();
  }

  if (user.registered2FA && !session.twoFactorVerified) {
    return genericForbiddenErrorResult();
  }

  if (!bucket.check(user.id, 1)) {
    return genericTooManyRequestsResult();
  }

  await remove2FAFromSignedInUser();

  return genericSuccesResult(null, "2-faktors autentisiering togs bort");
}
