"use client";

import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { ITwoFactorSetupFormData, twoFactorSetupFormDataSchema } from "@/actions/2fa/schema";
import { setup2FAAction } from "@/actions/2fa";

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
    await setup2FAAction(data);
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
      <Button type="submit" fullWidth mt="xl" size="md" color="dark">
        Sätt upp
      </Button>
		</form>
	);
}
