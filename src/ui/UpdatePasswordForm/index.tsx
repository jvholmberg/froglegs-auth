"use client";

import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { ROUTE_HOME } from "@/lib/client/constants";
import { redirect } from "next/navigation";
import { IUpdatePasswordFormData, updatePasswordFormDataSchema } from "@/app/settings/update-password/schema";
import { updatePasswordAction } from "@/app/settings/update-password/actions";

export function UpdatePasswordForm() {
	const form = useForm<IUpdatePasswordFormData>({
    mode: "controlled",
    initialValues: {
      password: "",
      passwordNew: "",
    },
    validate: {
      password: (value) => {
        const field = updatePasswordFormDataSchema.pick({ password: true }).safeParse({ password: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
      passwordNew: (value) => {
        const field = updatePasswordFormDataSchema.pick({ passwordNew: true }).safeParse({ passwordNew: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
    },
  });

  const handleSubmit = async (data: IUpdatePasswordFormData) => {
    const { error, notification } =  await updatePasswordAction(data);
    notifications.show(notification);
    if (!error) {
      redirect(ROUTE_HOME);
    }
  };

	return (
		<form
      onSubmit={form.onSubmit(handleSubmit)}
      onReset={form.onReset}>
      <TextInput
        key={form.key(`password`)}
        mb="md"
        size="md"
        type="password"
        label="Nuvarande lösenord"
        placeholder="Ange ditt befintliga lösenord"
        {...form.getInputProps(`password`)} />
      <TextInput
        key={form.key(`passwordNew`)}
        size="md"
        type="password"
        label="Nytt lösenord"
        placeholder="Ange önskat nytt lösenord"
        {...form.getInputProps(`passwordNew`)} />
      <Button type="submit" fullWidth mt="lg" size="md" color="dark">
        Uppdatera
      </Button>
		</form>
	);
}
