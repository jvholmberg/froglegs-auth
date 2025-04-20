"use client";

import { verify2FAAction } from "@/app/(anonymous)/2fa/actions";
import { ITwoFactorVerifyFormData, twoFactorSetupFormDataSchema } from "@/app/(anonymous)/2fa/schema";
import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

export function TwoFactorVerificationForm() {
	const form = useForm<ITwoFactorVerifyFormData>({
    mode: "controlled",
    initialValues: {
      code: "",
    },
    validate: {
      code: (value) => {
        const field = twoFactorSetupFormDataSchema.pick({ code: true }).safeParse({ code: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
    },
  });

  const handleSubmit = async (data: ITwoFactorVerifyFormData) => {
    const { notification } = await verify2FAAction(data);
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
        Verifiera
      </Button>
		</form>
	);
}
