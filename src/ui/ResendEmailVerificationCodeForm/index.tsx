"use client";

import { Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { resendEmailVerificationCodeAction } from "@/actions/verify-email";

export function ResendEmailVerificationCodeForm() {
	const form = useForm({
    mode: "controlled",
    initialValues: {
    },
    validate: {
    },
  });

  const handleSubmit = async () => {
    await resendEmailVerificationCodeAction();
  };
  
	return (
		<form
      onSubmit={form.onSubmit(handleSubmit)}
      onReset={form.onReset}>
      <Button type="submit" fullWidth mt="xl" size="md" variant="outline" color="dark">
        Skicka ny kod
      </Button>
		</form>
	);
}
