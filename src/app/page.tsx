
import { redirect } from "next/navigation";
import { globalGETRateLimit } from "@/lib/server/request";
import { getCurrentSession } from "@/lib/server/session";
import { ROUTE_2FA, ROUTE_2FA_SETUP, ROUTE_SETTINGS, ROUTE_SIGN_IN, ROUTE_VERIFY_EMAIL } from "@/lib/client/constants";

export default async function HomePage() {
  const belowRateLimit = await globalGETRateLimit();
  if (!belowRateLimit) {
    return "För många anrop";
  }
  const { session, user } = await getCurrentSession();
  if (session !== null) {
    if (!user.emailVerified) {
      return redirect(ROUTE_VERIFY_EMAIL);
    }
    if (!user.registered2FA) {
      return redirect(ROUTE_2FA_SETUP);
    }
    if (!session.twoFactorVerified) {
      return redirect(ROUTE_2FA);
    }
    return redirect(ROUTE_SETTINGS);
  }
  return redirect(ROUTE_SIGN_IN);
}
