import { redirect, RedirectType } from "next/navigation";
import { Group, Title, Card } from "@mantine/core";
import { ROUTE_SIGN_IN } from "@/lib/client/constants";
import { getRoles } from "@/lib/server/role";
import { getCurrentSession } from "@/lib/server/session";
import { getUsers } from "@/lib/server/user";
import { checkHasUserRole } from "@/lib/server/utils";
import { AdminUserList } from "@/ui/AdminUserList";
import { PageTransition } from "@/ui/PageTransition";

export default async function AdminPage() {
  // Prevent unauthorized users from accesing page 
  const { user } = await getCurrentSession();
  if (!user) {
    return redirect(ROUTE_SIGN_IN, RedirectType.replace);
  }
  if (!checkHasUserRole(["super_admin"], user)) {
    return redirect(ROUTE_SIGN_IN, RedirectType.replace);
  }

  const users = await getUsers();
  const roles = await getRoles()
  

  return (
    <PageTransition>
      <Group pb="md" justify="space-between">
        <div></div>
        <Title order={2} fw={100}>Administrera användare</Title>
      </Group>
      <Card>
        <AdminUserList data={users} roles={roles}  />
      </Card>
    </PageTransition>
  );
}
