"use client";

import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IVerifyEmailFormData, verifyEmailFormDataSchema } from "@/actions/verify-email/schema";
import { verifyEmailAction } from "@/actions/verify-email";

export function EmailVerificationForm() {
	const form = useForm<IVerifyEmailFormData>({
    mode: "controlled",
    initialValues: {
      code: "",
    },
    validate: {
      code: (value) => {
        const field = verifyEmailFormDataSchema.pick({ code: true }).safeParse({ code: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
    },
  });

  const handleSubmit = async (data: IVerifyEmailFormData) => {
    await verifyEmailAction(data);
  };

	return (
		<form
      onSubmit={form.onSubmit(handleSubmit)}
      onReset={form.onReset}>
      <TextInput
        key={form.key(`code`)}
        size="md"
        label="Verifikationskod"
        placeholder="Ange din verifikationskod"
        {...form.getInputProps(`code`)} />
      <Button type="submit" fullWidth mt="xl" size="md" color="dark">
        Verifiera e-post
      </Button>
		</form>
	);
}
