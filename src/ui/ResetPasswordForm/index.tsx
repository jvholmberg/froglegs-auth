"use client";

import { PasswordInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { resetPasswordAction } from "@/actions/reset-password";
import { IResetPasswordFormData, resetPasswordFormDataSchema } from "@/actions/reset-password/schema";

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
    await resetPasswordAction(data);
  };
  
	return (
		<form
      onSubmit={form.onSubmit(handleSubmit)}
      onReset={form.onReset}>
      <PasswordInput
        withAsterisk
        key={form.key(`password`)}
        label="Lösenord"
        placeholder="Ange nytt lösenord"
        {...form.getInputProps(`password`)} />
      <Button type="submit" fullWidth mt="xl" size="md" color="dark">
        Spara
      </Button>
		</form>
	);
}
