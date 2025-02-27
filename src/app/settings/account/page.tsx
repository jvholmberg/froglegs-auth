import { getCurrentSession } from "@/lib/server/session";
import { SettingsAccountForm } from "@/ui/SettingsAccountForm";

export default async function SettingsSessionsPage() {
  const { user } = await getCurrentSession();
  return (
    <>
      <SettingsAccountForm data={user!} />
    </>
  )
}
