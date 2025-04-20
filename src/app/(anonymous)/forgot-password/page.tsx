import Link from "next/link";
import { Center, Text, Title } from "@mantine/core";
import { globalGETRateLimit } from "@/lib/server/request";
import { ForgotPasswordForm } from "@/ui/ForgotPasswordForm";
import { ROUTE_SIGN_IN } from "@/lib/client/constants";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { PageTransition } from "@/ui/PageTransition";

import classes from "./page.module.css";

export default async function ForgotPasswordPage() {
  const belowRateLimit = await globalGETRateLimit();
	if (!belowRateLimit) {
		return (
      <ErrorMessage
        title="Ta det lugnt!"
        message="Vi har uppmärksammat misstänkt beteende från dig. Du har skickat väldigt många frågor mot servern!" />
    );
	}
	return (
		<PageTransition>
      <Title order={2} className={classes.title} ta="center" mt="md" fw={100}>
        Glömt ditt lösenord?
      </Title>
      <Text ta="center" mt="sm" mb="lg" fz="xs">
        Ange din e-post.
        Ett email kommer skickas till dig med en kod som du kan använda för att ändra ditt lösenord
      </Text>
			<ForgotPasswordForm />
      <Center mt="md">
        <Text component={Link} td="underline" fw={700} href={ROUTE_SIGN_IN}>
          Logga in
        </Text>
      </Center>
		</PageTransition>
	);
}
