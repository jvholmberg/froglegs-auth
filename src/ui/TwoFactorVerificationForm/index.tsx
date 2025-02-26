"use client";

import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { ITwoFactorVerifyFormData, twoFactorSetupFormDataSchema } from "@/actions/2fa/schema";
import { verify2FAAction } from "@/actions/2fa";

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
    await verify2FAAction(data);
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
      <Button type="submit" fullWidth mt="xl" size="md" color="dark">
        Verifiera
      </Button>
		</form>
	);
}
