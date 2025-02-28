import { getMyAppInvitations } from "@/lib/server/app"
import { AppInvitationList } from "@/ui/AppInvitationList";

export default async function InvitationsPage() {
  const invitations = await getMyAppInvitations();
  return (
    <AppInvitationList data={invitations} />
  );
}
