import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, Text, Title } from "@mantine/core";
import { ROUTE_HOME, ROUTE_SIGN_IN } from "@/lib/client/constants";
import { globalGETRateLimit } from "@/lib/server/request";
import { getCurrentSession } from "@/lib/server/session";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { UpdatePasswordForm } from "@/ui/UpdatePasswordForm";
import { PageTransition } from "@/ui/PageTransition";

import classes from "./page.module.css";

export default async function UpdatePasswordPage() {
  const belowRateLimit = await globalGETRateLimit();
	if (!belowRateLimit) {
    return (
      <ErrorMessage
        title="Ta det lugnt!"
        message="Vi har uppmärksammat misstänkt beteende från dig. Du har skickat väldigt många frågor mot servern!" />
    );
  }
	const { user } = await getCurrentSession();
	if (user === null) {
		return redirect(ROUTE_SIGN_IN);
	}

	return (
    <PageTransition>
      <Title order={2} className={classes.title} ta="center" mt="md" mb="xl" fw={100}>
        Uppdatera lösenord
      </Title>
      <Text ta="center" mb="md">
        Byt lösenord för ditt konto. Ange ditt nuvarande lösenord samt önskat nytt lösenord
      </Text>
      <UpdatePasswordForm />
      <Button
        component={Link}
        href={ROUTE_HOME}
        fullWidth
        mt="md"
        size="md"
        variant="outline"
        color="dark">
        Tillbaka
      </Button>
    </PageTransition>
	);
}
