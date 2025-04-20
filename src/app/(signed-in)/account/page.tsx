import Link from "next/link";
import { redirect } from "next/navigation";
import { Group, Title, Card, Button } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { getCurrentSession } from "@/lib/server/session";
import { PageTransition } from "@/ui/PageTransition";
import { SettingsAccountForm } from "@/ui/SettingsAccountForm";
import { ROUTE_HOME, ROUTE_SIGN_IN } from "@/lib/client/constants";

export default async function AccountPage() {
  const { user } = await getCurrentSession();
  if (!user) {
    return redirect(ROUTE_SIGN_IN);
  }
  return (
    <PageTransition>
      <Group pb="md" justify="space-between">
        <div>
          <Button
            component={Link}
            href={ROUTE_HOME}
            color="dark"
            variant="subtle"
            leftSection={<IconArrowLeft />}>
            Till hemskärm
          </Button>
        </div>
        <Title order={2} fw={100}>Mitt konto</Title>
      </Group>
      <Card>
        <SettingsAccountForm data={user!} />
      </Card>
    </PageTransition>
  );
}
