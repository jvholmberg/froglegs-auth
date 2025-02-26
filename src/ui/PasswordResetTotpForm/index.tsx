"use client";

import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IPasswordResetRecoveryCodeFormData, passwordResetRecoveryCodeFormDataSchema } from "@/actions/reset-password/schema";
import { verifyPasswordReset2FAWithTOTPAction } from "@/actions/reset-password";

export function PasswordResetTOTPForm() {
	const form = useForm<IPasswordResetRecoveryCodeFormData>({
    mode: "controlled",
    initialValues: {
      code: "",
    },
    validate: {
      code: (value) => {
        const field = passwordResetRecoveryCodeFormDataSchema.pick({ code: true }).safeParse({ code: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
    },
  });

  const handleSubmit = async (data: IPasswordResetRecoveryCodeFormData) => {
    await verifyPasswordReset2FAWithTOTPAction(data);
  };
  
	return (
		<form
      onSubmit={form.onSubmit(handleSubmit)}
      onReset={form.onReset}>
      <TextInput
        key={form.key(`code`)}
        size="md"
        label="Engångskod"
        placeholder="Ange koden i appen"
        {...form.getInputProps(`code`)} />
      <Button type="submit" fullWidth mt="xl" size="md" color="dark">
        Verifiera
      </Button>
		</form>
	);
}
