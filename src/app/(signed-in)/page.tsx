
import { globalGETRateLimit } from "@/lib/server/request";
import { getCurrentSession } from "@/lib/server/session";
import { getAppsForUser } from "@/lib/server/app";
import { AppGrid } from "@/ui/AppGrid";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { PageTransition } from "@/ui/PageTransition";

export default async function HomePage() {
  const belowRateLimit = await globalGETRateLimit();
  if (!belowRateLimit) {
    return (
      <ErrorMessage
        title="Ta det lugnt!"
        message="Vi har uppmärksammat misstänkt beteende från dig. Du har skickat väldigt många frågor mot servern!" />
    );
  }
  const { user } = await getCurrentSession();
  const apps = await getAppsForUser(user?.id);
  return (
    <PageTransition>
      <AppGrid data={apps} />
    </PageTransition>
  );
}
