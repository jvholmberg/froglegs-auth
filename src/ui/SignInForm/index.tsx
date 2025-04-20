"use client";

import { signInAction } from "@/app/(anonymous)/sign-in/actions";
import { ISignInFormData, signInFormDataSchema } from "@/app/(anonymous)/sign-in/schema";
import { PasswordInput, TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

export function SignInForm() {
  const form = useForm<ISignInFormData>({
    mode: "controlled",
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => {
        const field = signInFormDataSchema.pick({ email: true }).safeParse({ email: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
      password: (value) => {
        const field = signInFormDataSchema.pick({ password: true }).safeParse({ password: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
    },
  });
  
  const handleSubmit = async (data: ISignInFormData) => {
    const { notification } = await signInAction(data);
    notifications.show(notification);
  };

	return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
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
      {/* <Checkbox
        key={form.key(`keepSignedIn`)}
        mt="md"
        size="md"
        label="Håll mig inloggad"
        {...form.getInputProps(`keepSignedIn`)} /> */}
      <Button type="submit" fullWidth mt="lg" size="md" color="dark">
        Logga in
      </Button>
    </form>
  );
}
