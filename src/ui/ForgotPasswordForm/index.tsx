"use client";

import { forgotPasswordAction } from "@/actions/forgot-password";
import { forgotPasswordFormDataSchema, IForgotPasswordFormData } from "@/actions/forgot-password/schema";
import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";

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
    await forgotPasswordAction(data);
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
      <Button type="submit" fullWidth mt="xl" size="md" color="dark">
        Skicka
      </Button>
		</form>
	);
}
