import { redirect } from "next/navigation";
import Link from "next/link";
import { Group, Button, Title, Card } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { getAppInvitations } from "@/lib/server/app"
import { getCurrentSession } from "@/lib/server/session";
import { AppInvitationList } from "@/ui/AppInvitationList";
import { PageTransition } from "@/ui/PageTransition";
import { ROUTE_INVITATIONS_SEND, ROUTE_SIGN_IN } from "@/lib/client/constants";

export default async function InvitationsPage() {
  const { user } = await getCurrentSession();
  if (!user) {
    return redirect(ROUTE_SIGN_IN);
  }
  const invitations = await getAppInvitations(user);
  return (
    <PageTransition>
      <Group pb="md" justify="space-between">
        <div>
          <Button
            component={Link}
            href={ROUTE_INVITATIONS_SEND}
            color="dark"
            variant="subtle"
            leftSection={<IconPlus />}>
            Bjud in
          </Button>
        </div>
        <Title order={2} fw={100}>Mina inbjudningar</Title>
      </Group>
      <Card>
        <AppInvitationList data={invitations} />
      </Card>
    </PageTransition>
  );
}
