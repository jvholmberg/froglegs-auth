import { ROUTE_2FA_SETUP } from "@/lib/client/constants";
import { getCurrentSession } from "@/lib/server/session";
import { SettingsAccountForm } from "@/ui/SettingsAccountForm";
import { Center } from "@mantine/core";
import Link from "next/link";

export default async function AccountPage() {
  const { user } = await getCurrentSession();
  return (
    <>
      <SettingsAccountForm data={user!} />
      {!user?.registered2FA && (
        <Center pt="md">
          <Link href={ROUTE_2FA_SETUP}>Sätt upp 2-faktors autentisering</Link>
        </Center>
      )}
    </>
  )
}
