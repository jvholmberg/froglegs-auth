/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { NextResponse } from "next/server";
import { getApps } from "@/lib/server/app";
import { checkSignedIn } from "@/lib/server/utils";

export async function GET() {
  // Make sure user is logged in
  const unauthorized = await checkSignedIn();
  if (unauthorized) { return unauthorized; }
  
  const apps = await getApps();
  return NextResponse.json(apps);
}
