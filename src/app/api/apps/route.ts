/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/server/session";
import { ERR_NOT_ALLOWED, ERR_NOT_SIGNED_IN } from "@/lib/server/constants";
import { getApps } from "@/lib/server/app";

export async function GET() {
  const { user, session } = await getCurrentSession();
  if (session === null) {
    return NextResponse.json({ message: ERR_NOT_SIGNED_IN });
  }
  if (user.registered2FA && !session.twoFactorVerified) {
    return NextResponse.json({ message: ERR_NOT_ALLOWED });
  }
  
  const apps = await getApps();
  return NextResponse.json(apps);
}
