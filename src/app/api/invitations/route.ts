/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { NextResponse } from "next/server";
import { IAcceptAppInvitationFormData, ICreateAppInvitationFormData, IDeclineAppInvitationFormData } from "@/actions/invitation/schema";
import { acceptAppInvitationAction, createAppInvitationAction, declineAppInvitationAction } from "@/actions/invitation";

export async function POST(request: Request) {
  const body = await request.json() as ICreateAppInvitationFormData;
  const response = await createAppInvitationAction(body);
  return NextResponse.json({ success: !response.error });
}

export async function PUT(request: Request) {
  const body = await request.json() as IAcceptAppInvitationFormData;
  const response = await acceptAppInvitationAction(body);
  return NextResponse.json({ success: !response.error });
}

export async function DELETE(request: Request) {
  const body = await request.json() as IDeclineAppInvitationFormData;
  const response = await declineAppInvitationAction(body);
  return NextResponse.json({ success: !response.error });
}
