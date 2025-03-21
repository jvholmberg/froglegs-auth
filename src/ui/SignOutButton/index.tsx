"use client";

import { signoutAction } from "@/actions/sign-out";
import { Button } from "@mantine/core";
import { useActionState } from "react";
import { IconLogout } from "@tabler/icons-react";
import { useColorScheme } from "@mantine/hooks";

const initialState = {
	message: ""
};

export function SignOutButton() {
  const colorScheme = useColorScheme();
	const [, action] = useActionState(signoutAction, initialState);
	return (
		<form action={action}>
      <Button
        type="submit"
        variant="light"
        color="dark"
        fw={500}
        c={colorScheme === 'dark' ? "white" : "dark"}
        leftSection={<IconLogout />}>Logga ut</Button>
		</form>
	);
}
