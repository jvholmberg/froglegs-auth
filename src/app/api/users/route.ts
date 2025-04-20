/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { NextRequest, NextResponse } from "next/server";
import { checkApiRequestLoggedIn, checkHasAppUserRole } from "@/lib/server/utils";
import { getExternalUsers } from "@/lib/server/user";
import { getCurrentSession } from "@/lib/server/session";

export async function GET(request: NextRequest) {
  // Logged in?
  const currentSession = await getCurrentSession(true);
  const unauthorized = checkApiRequestLoggedIn([], currentSession);
  if (unauthorized !== null) {
    return unauthorized;
  }

  // Check if account has access to app
  const searchParams = request.nextUrl.searchParams;
  const appSlug = searchParams.get("appSlug");
  const partitionId = searchParams.get("partitionId");
  const organizationId = searchParams.get("organizationId");

  if (!appSlug) {
    return NextResponse.json([], { status: 400, statusText: "Ingen app angiven" });
  }
  if (!partitionId) {
    return NextResponse.json([], { status: 400, statusText: "Ingen partition angiven" });
  }
  if (!organizationId) {
    return NextResponse.json([], { status: 400, statusText: "Ingen organization angiven" });
  }

  const app = currentSession.user?.apps.find((e) => {
    if (e.appSlug !== appSlug) { return false; }
    if (e.externalPartitionId !== Number(partitionId)) { return false; }
    if (e.externalOrganizationId !== Number(organizationId)) { return false; }
    return true;
  });

  if (!app) {
    return NextResponse.json([], { status: 403, statusText: "Appen saknas eller så har du inte access till den!" });
  }

  const isAllowed = checkHasAppUserRole(
    app.appId,
    ["super_admin", "admin", "manager"],
    currentSession.user,
  );
  if (!isAllowed) {
    return NextResponse.json([], { status: 403, statusText: "Du har inte access!" });
  }

  const result = await getExternalUsers({
    appId: app.appId,
    externalPartitionId: app.externalPartitionId,
    externalOrganizationId: app.externalOrganizationId,
  });

  return NextResponse.json(result);
}
