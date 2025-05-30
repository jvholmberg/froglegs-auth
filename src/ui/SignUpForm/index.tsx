"use client";

import { PasswordInput, TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { ISignUpFormData, signUpFormDataSchema } from "@/app/(anonymous)/sign-up/schema";
import { signUpAction } from "@/app/(anonymous)/sign-up/actions";
import { notifications } from "@mantine/notifications";

export function SignUpForm() {
	const form = useForm<ISignUpFormData>({
      mode: "controlled",
      initialValues: {
        email: "",
        password: "",
        passwordVerify: "",
      },
      validate: {
        email: (value) => {
          const field = signUpFormDataSchema.pick({ email: true }).safeParse({ email: value });
          if (!field.success) {
            return field.error.errors.at(0)?.message;
          }
        },
        password: (value) => {
          const field = signUpFormDataSchema.pick({ password: true }).safeParse({ password: value });
          if (!field.success) {
            return field.error.errors.at(0)?.message;
          }
        },
        passwordVerify: (value) => {
          const field = signUpFormDataSchema.pick({ passwordVerify: true }).safeParse({ passwordVerify: value });
          if (!field.success) {
            return field.error.errors.at(0)?.message;
          }
        },
      },
  });

  const handleSubmit = async (data: ISignUpFormData) => {
    const { notification } = await signUpAction(data);
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
      <PasswordInput
        key={form.key(`password`)}
        mt="md"
        size="md"
        label="Lösenord"
        placeholder="Ditt lösenord"
        {...form.getInputProps(`password`)} />
      <PasswordInput
        key={form.key(`passwordVerify`)}
        mt="md"
        size="md"
        label="Verifiera lösenord"
        placeholder="Ditt lösenord igen"
        {...form.getInputProps(`passwordVerify`)} />
      <Button type="submit" fullWidth mt="lg" size="md" color="dark">
        Skapa konto
      </Button>
		</form>
	);
}
