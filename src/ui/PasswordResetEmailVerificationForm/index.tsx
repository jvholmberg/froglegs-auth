"use client";

import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IPasswordResetEmailVerificationFormData, passwordResetEmailVerificationFormDataSchema } from "@/actions/reset-password/schema";
import { verifyPasswordResetEmailAction } from "@/actions/reset-password";

export function PasswordResetEmailVerificationForm() {
	const form = useForm<IPasswordResetEmailVerificationFormData>({
    mode: "controlled",
    initialValues: {
      code: "",
    },
    validate: {
      code: (value) => {
        const field = passwordResetEmailVerificationFormDataSchema.pick({ code: true }).safeParse({ code: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
    },
  });

  const handleSubmit = async (data: IPasswordResetEmailVerificationFormData) => {
    await verifyPasswordResetEmailAction(data);
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
