import { getMyApps } from "@/lib/server/app"
import { getCurrentSession } from "@/lib/server/session";
import { AppTable } from "@/ui/AppTable";


export default async function SettingsPage() {
  const { user } = await getCurrentSession();
  const apps = await getMyApps(user!);
  return (
    <>
      <AppTable data={apps} />
    </>
  )
}
