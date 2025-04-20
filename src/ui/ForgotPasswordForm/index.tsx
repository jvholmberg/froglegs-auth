"use client";

import { forgotPasswordAction } from "@/app/(anonymous)/forgot-password/actions";
import { forgotPasswordFormDataSchema, IForgotPasswordFormData } from "@/app/(anonymous)/forgot-password/schema";
import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

export function ForgotPasswordForm() {
	const form = useForm<IForgotPasswordFormData>({
    mode: "controlled",
    initialValues: {
      email: "",
    },
    validate: {
      email: (value) => {
        const field = forgotPasswordFormDataSchema.pick({ email: true }).safeParse({ email: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
    },
  });

  const handleSubmit = async (data: IForgotPasswordFormData) => {
    const { notification } = await forgotPasswordAction(data);
    notifications.show(notification);
  };

	return (
		<form
      onSubmit={form.onSubmit(handleSubmit)}
      onReset={form.onReset}>
      <TextInput
        key={form.key(`email`)}
        size="md"
        label="E-post"
        placeholder="hej@gmail.com"
        {...form.getInputProps(`email`)} />
      <Button type="submit" fullWidth mt="lg" size="md" color="dark">
        Skicka
      </Button>
		</form>
	);
}
