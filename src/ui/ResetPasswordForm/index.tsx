"use client";

import { resetPasswordAction } from "@/app/(anonymous)/reset-password/actions";
import { IResetPasswordFormData, resetPasswordFormDataSchema } from "@/app/(anonymous)/reset-password/schema";
import { PasswordInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

export function PasswordResetForm() {
  const form = useForm<IResetPasswordFormData>({
    mode: "controlled",
    initialValues: {
      password: "",
    },
    validate: {
      password: (value) => {
        const field = resetPasswordFormDataSchema.pick({ password: true }).safeParse({ password: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
    },
  });
  
  const handleSubmit = async (data: IResetPasswordFormData) => {
    const { notification } = await resetPasswordAction(data);
    notifications.show(notification);
  };
  
	return (
		<form
      onSubmit={form.onSubmit(handleSubmit)}
      onReset={form.onReset}>
      <PasswordInput
        key={form.key(`password`)}
        label="Lösenord"
        placeholder="Ange nytt lösenord"
        {...form.getInputProps(`password`)} />
      <Button type="submit" fullWidth mt="lg" size="md" color="dark">
        Spara
      </Button>
		</form>
	);
}
