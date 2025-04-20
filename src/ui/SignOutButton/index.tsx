"use client";

import { signoutAction } from "@/app/(signed-in)/actions";
import { Button } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { useColorScheme } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useForm } from "@mantine/form";

export function SignOutButton() {
  const colorScheme = useColorScheme();
  const form = useForm({
    mode: "controlled",
    initialValues: {
    },
    validate: {
    },
  });

  const handleSubmit = async () => {
    const { notification } = await signoutAction();
    notifications.show(notification);
  };

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
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
