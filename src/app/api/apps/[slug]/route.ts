/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { NextRequest, NextResponse } from "next/server";
import { checkApiRequestLoggedIn } from "@/lib/server/utils";
import { getApp, updateUserApp } from "@/lib/server/app";
import { getCurrentSession } from "@/lib/server/session";
import { IUpdateUserAppFormData, updateUserAppFormDataSchema } from "@/app/(signed-in)/admin/schema";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  // Logged in?
  const useAuthorizationHeader = true;
  const currentSession = await getCurrentSession(useAuthorizationHeader);
  const unauthorized = checkApiRequestLoggedIn({}, currentSession);
  if (unauthorized !== null) {
    return unauthorized;
  }

  // Determine which app we should act upon
  const { slug } = await params;
  const app = await getApp({ slug });

  if (app === null) {
    return NextResponse.json({}, {
      status: 400,
      statusText: "Kunde inte hitta app!",
    });
  }

  // Validate provided data
  const body = await request.json() as IUpdateUserAppFormData;
  try {
    await updateUserAppFormDataSchema.parseAsync(body);
  } catch {
    return NextResponse.json({}, {
      status: 400,
      statusText: "Felaktig data!",
    });
  }

  const success = await updateUserApp(
    app.id,
    currentSession.user!.id,
    body,
  );

  if (success) {
    return NextResponse.json({}, { status: 201, statusText: "App uppdaterades för användare" });
  } else {
    return NextResponse.json({}, {
      status: 500,
      statusText: "Något gick fel!",
    });
  }
}
