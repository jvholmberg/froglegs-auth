import SignedInLayout from '@/ui/SignedInLayout';
import { ROUTE_SIGN_IN, ROUTE_VERIFY_EMAIL, ROUTE_2FA_SETUP, TWO_FACTOR_MANDATORY } from '@/lib/client/constants';
import { getCurrentSession } from '@/lib/server/session';
import { redirect } from 'next/navigation';

export default async function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { session, user } = await getCurrentSession();
  if (session === null) {
    return redirect(ROUTE_SIGN_IN);
  }
  if (!user.emailVerified) {
    return redirect(ROUTE_VERIFY_EMAIL);
  }
  const twoFaNotRegistered = TWO_FACTOR_MANDATORY && !user.registered2FA;
  const userSessionNotVerified = user.registered2FA && !session.twoFactorVerified;
  if (twoFaNotRegistered || userSessionNotVerified) {
    return redirect(ROUTE_2FA_SETUP);
  }

  return (
    <SignedInLayout user={user}>
      {children}
    </SignedInLayout>
  );
}
