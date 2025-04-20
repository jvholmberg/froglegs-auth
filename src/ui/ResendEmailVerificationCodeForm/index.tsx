"use client";

import { Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { resendEmailVerificationCodeAction } from "@/app/(anonymous)/verify-email/actions";
import { notifications } from "@mantine/notifications";

export function ResendEmailVerificationCodeForm() {
	const form = useForm({
    mode: "controlled",
    initialValues: {
    },
    validate: {
    },
  });

  const handleSubmit = async () => {
    const { notification } = await resendEmailVerificationCodeAction();
    notifications.show(notification);
  };
  
	return (
		<form
      onSubmit={form.onSubmit(handleSubmit)}
      onReset={form.onReset}>
      <Button type="submit" fullWidth mt="md" size="md" variant="outline" color="dark">
        Skicka ny kod
      </Button>
		</form>
	);
}
