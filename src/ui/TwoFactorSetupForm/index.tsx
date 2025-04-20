"use client";

import { setup2FAAction } from "@/app/(anonymous)/2fa/actions";
import { ITwoFactorSetupFormData, twoFactorSetupFormDataSchema } from "@/app/(anonymous)/2fa/schema";
import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

export function TwoFactorSetupForm(props: { encodedTOTPKey: string }) {
	const form = useForm<ITwoFactorSetupFormData>({
    mode: "controlled",
    initialValues: {
      key: props.encodedTOTPKey,
      code: "",
    },
    validate: {
      key: (value) => {
        const field = twoFactorSetupFormDataSchema.pick({ key: true }).safeParse({ key: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
      code: (value) => {
        const field = twoFactorSetupFormDataSchema.pick({ code: true }).safeParse({ code: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
    },
  });

  const handleSubmit = async (data: ITwoFactorSetupFormData) => {
    const { notification } = await setup2FAAction(data);
    notifications.show(notification);
  };
  
	return (
		<form
      onSubmit={form.onSubmit(handleSubmit)}
      onReset={form.onReset}>
      <input
        name="key"
        value={props.encodedTOTPKey}
        hidden
        {...form.getInputProps(`key`)} />
      <TextInput
        key={form.key(`code`)}
        size="md"
        label="Engångskod"
        placeholder="Ange koden i appen"
        {...form.getInputProps(`code`)} />
      <Button type="submit" fullWidth mt="lg" size="md" color="dark">
        Koppla ihop
      </Button>
		</form>
	);
}
