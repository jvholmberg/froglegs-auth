import SignedInLayout from '@/ui/SignedInLayout';
import { getCurrentSession } from '@/lib/server/session';
import { ROUTE_SIGN_IN, ROUTE_VERIFY_EMAIL, ROUTE_2FA_SETUP, ROUTE_2FA, TWO_FACTOR_MANDATORY } from '@/lib/client/constants';
import { redirect } from 'next/navigation';

export default async function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { session, user } = await getCurrentSession();
  if (!session) {
    return redirect(ROUTE_SIGN_IN);
  }
  if (!user.emailVerified) {
    return redirect(ROUTE_VERIFY_EMAIL);
  }
  if (TWO_FACTOR_MANDATORY && !user.registered2FA) {
    return redirect(ROUTE_2FA_SETUP);
  }
  if (user.registered2FA && !session.twoFactorVerified) {
    return redirect(ROUTE_2FA);
  }
  return (
    <SignedInLayout user={user}>
      {children}
    </SignedInLayout>
  );
}
