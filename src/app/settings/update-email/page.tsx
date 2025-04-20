import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, Text, Title } from "@mantine/core";
import { ROUTE_HOME, ROUTE_SIGN_IN } from "@/lib/client/constants";
import { globalGETRateLimit } from "@/lib/server/request";
import { getCurrentSession } from "@/lib/server/session";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { UpdateEmailForm } from "@/ui/UpdateEmailForm";
import { PageTransition } from "@/ui/PageTransition";

import classes from "./page.module.css";

export default async function UpdateEmailPage() {
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
      <Title order={2} className={classes.title} ta="center" mt="md" fw={100}>
        Byt e-post
      </Title>
      <Text ta="center" mt="sm" mb="lg" fz="xs">
        Din nuvarande e-post: <b>{user.email}</b>
      </Text>
      <Text ta="center" mt="sm" mb="lg" fz="xs">
        Mata in den e-post som du vill byta till. Du kommer behöva verifiera den med en kod som skickas till dig i nästa steg.
      </Text>
      <UpdateEmailForm />
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
