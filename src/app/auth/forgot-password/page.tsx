import Link from "next/link";

import { globalGETRateLimit } from "@/lib/server/request";
import { ForgotPasswordForm } from "@/ui/ForgotPasswordForm";
import { Center, Text, Title } from "@mantine/core";

import classes from "./page.module.css";
import { ROUTE_SIGN_IN } from "@/lib/client/constants";

export default async function ForgotPasswordPage() {
  const belowRateLimit = await globalGETRateLimit();
	if (!belowRateLimit) {
		return "Too many requests";
	}
	return (
		<>
    <Title order={2} className={classes.title} ta="center" mt="md" mb={50}>
      Glömt ditt lösenord?
    </Title>
			<ForgotPasswordForm />
      <Center mt="md">
        <Text component={Link} td="underline" fw={700} href={ROUTE_SIGN_IN}>
          Logga in
        </Text>
      </Center>
		</>
	);
}
