import { redirect } from "next/navigation";
import Link from "next/link";
import { Group, Button, Title } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { getApps, getAppsForUser } from "@/lib/server/app"
import { getCurrentSession } from "@/lib/server/session";
import { AppInvitationForm } from "@/ui/AppInvitationForm";
import { getRolesUpToRank } from "@/lib/server/role";
import { PageTransition } from "@/ui/PageTransition";
import { ROUTE_INVITATIONS, ROUTE_SIGN_IN } from "@/lib/client/constants";
import { checkHasUserRole } from "@/lib/server/utils";

export default async function SendInvitationPage() {
  const { user } = await getCurrentSession();
  if (!user) {
    return redirect(ROUTE_SIGN_IN);
  }

  // Super admins should be able to invite to all apps.
  const apps = checkHasUserRole(["super_admin"], user)
    ? await getApps()
    : await getAppsForUser(user.id);
    
  const roles = await getRolesUpToRank(user.role);
  return (
    <PageTransition>
      <Group pb="md" justify="space-between">
        <div>
          <Button
            component={Link}
            href={ROUTE_INVITATIONS}
            color="dark"
            variant="subtle"
            leftSection={<IconArrowLeft />}>
            Tillbaka
          </Button>
        </div>
        <Title order={2} fw={100}>Skicka inbjudan</Title>
      </Group>
        <AppInvitationForm
          user={user}
          apps={apps} 
          roles={roles} />
    </PageTransition>
  );
}
