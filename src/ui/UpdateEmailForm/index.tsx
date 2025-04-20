"use client";

import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IUpdateEmailFormData, updateEmailFormDataSchema } from "@/app/settings/update-email/schema";
import { updateEmailAction } from "@/app/settings/update-email/actions";
import { notifications } from "@mantine/notifications";
import { ROUTE_VERIFY_EMAIL } from "@/lib/client/constants";
import { redirect } from "next/navigation";

export function UpdateEmailForm() {
	const form = useForm<IUpdateEmailFormData>({
    mode: "controlled",
    initialValues: {
      email: "",
    },
    validate: {
      email: (value) => {
        const field = updateEmailFormDataSchema.pick({ email: true }).safeParse({ email: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
    },
  });

  const handleSubmit = async (data: IUpdateEmailFormData) => {
    const { notification, error } =  await updateEmailAction(data);
    notifications.show(notification);
    if (!error) {
      redirect(ROUTE_VERIFY_EMAIL);
    }
  };

	return (
		<form
      onSubmit={form.onSubmit(handleSubmit)}
      onReset={form.onReset}>
      <TextInput
        key={form.key(`email`)}
        size="md"
        type="email"
        label="Ny e-post"
        placeholder="Ange din nya e-post"
        {...form.getInputProps(`email`)} />
      <Button type="submit" fullWidth mt="lg" size="md" color="dark">
        Uppdatera
      </Button>
		</form>
	);
}
