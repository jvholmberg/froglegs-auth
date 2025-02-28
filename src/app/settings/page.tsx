import { getMyApps } from "@/lib/server/app"
import { getCurrentSession } from "@/lib/server/session";
import { AppList } from "@/ui/AppList";


export default async function SettingsPage() {
  const { user } = await getCurrentSession();
  const apps = await getMyApps(user!);
  return (
    <>
      <AppList data={apps} />
    </>
  )
}
