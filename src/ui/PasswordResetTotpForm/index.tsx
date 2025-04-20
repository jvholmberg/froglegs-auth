"use client";

import { verifyPasswordReset2FAWithTOTPAction } from "@/app/(anonymous)/reset-password/actions";
import { IPasswordResetRecoveryCodeFormData, passwordResetRecoveryCodeFormDataSchema } from "@/app/(anonymous)/reset-password/schema";
import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

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
    const { notification } = await verifyPasswordReset2FAWithTOTPAction(data);
    notifications.show(notification);
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
      <Button type="submit" fullWidth mt="lg" size="md" color="dark">
        Verifiera med engångskod
      </Button>
		</form>
	);
}
