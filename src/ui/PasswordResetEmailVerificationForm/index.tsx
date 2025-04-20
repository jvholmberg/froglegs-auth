"use client";

import { verifyPasswordResetEmailAction } from "@/app/(anonymous)/reset-password/actions";
import { IPasswordResetEmailVerificationFormData, passwordResetEmailVerificationFormDataSchema } from "@/app/(anonymous)/reset-password/schema";
import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

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
    const { notification } = await verifyPasswordResetEmailAction(data);
    notifications.show(notification);
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
      <Button type="submit" fullWidth mt="lg" size="md" color="dark">
        Verifiera e-post
      </Button>
		</form>
	);
}
