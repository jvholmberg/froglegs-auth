/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { NextRequest, NextResponse } from "next/server";
import { deleteSessionTokenCookie, getCurrentSession, invalidateSession } from "@/lib/server/session";
import { ROUTE_SIGN_IN, TWO_FACTOR_MANDATORY } from "@/lib/client/constants";
import { EApiUser } from "@/app/api/schema";
import { globalPOSTRateLimit } from "@/lib/server/request";
import { genericTooManyRequestsResult, genericNotLoggedInErrorResult } from "@/lib/server/utils";
import { redirect } from "next/navigation";

export async function GET(req: NextRequest): Promise<NextResponse> {

  // Get session
  const { user, session } = await getCurrentSession(true);

  // Check if user is logged in
  if (!session) {
    return NextResponse.json({}, {
      status: 401,
      statusText: "Inte inloggad!",
    });
  }
  if (!user) {
    return NextResponse.json({}, {
      status: 401,
      statusText: "Inte inloggad!",
    });
  }

  // Check if account is setup correctly
  if (!user.emailVerified) {
    return NextResponse.json({}, {
      status: 403,
      statusText: "Du har inte verifierat din e-post!!",
    });
  }
  if (TWO_FACTOR_MANDATORY) {
    if (!user.registered2FA) {
      return NextResponse.json({}, {
        status: 403,
        statusText: "Du saknar 2-faktors autentisering på ditt konto!",
      });
    }
    if (!session.twoFactorVerified) {
      return NextResponse.json({}, {
        status: 401,
        statusText: "Du har inte autentiserat dig med din 2-faktors autentisering!",
      });
    }
  } else {
    if (user.registered2FA && !session.twoFactorVerified) {
      return NextResponse.json({}, {
        status: 401,
        statusText: "Du har inte autentiserat dig med din 2-faktors autentisering!",
      });
    }
  }

  // Check if account has access to app
  const searchParams = req.nextUrl.searchParams;
  const appSlug = searchParams.get("appSlug");

  if (!appSlug) {
    return NextResponse.json({}, { status: 400, statusText: "Ingen app angiven" });
  }

  const app = user.apps.find((e) => e.appSlug === appSlug);
  if (!app) {
    return NextResponse.json({}, { status: 403, statusText: "Appen saknas eller så har du inte access till den!" });
  }

  // All checks passed
  const res: EApiUser = {
    id: user.id,
    externalPartitionId: app.externalPartitionId,
    externalOrganizationId: app.externalOrganizationId,
    externalId: app.externalId,
    email: user.email,
    role: app.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };
  return NextResponse.json(res);
}

export async function DELETE(): Promise<NextResponse> {
  if (!globalPOSTRateLimit()) {
    return NextResponse.json(genericTooManyRequestsResult());
  }
  const { session } = await getCurrentSession(true);
  if (session === null) {
    return NextResponse.json(genericNotLoggedInErrorResult());
  }
  await invalidateSession(session.id);
  await deleteSessionTokenCookie();
  return redirect(ROUTE_SIGN_IN);
}
