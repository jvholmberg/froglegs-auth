"use client";

import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { ITwoFactorResetFormData, twoFactorResetFormDataSchema } from "@/actions/2fa/schema";
import { reset2FAAction } from "@/actions/2fa";

export function TwoFactorResetForm() {
	const form = useForm<ITwoFactorResetFormData>({
    mode: "controlled",
    initialValues: {
      code: "",
    },
    validate: {
      code: (value) => {
        const field = twoFactorResetFormDataSchema.pick({ code: true }).safeParse({ code: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
    },
  });

  const handleSubmit = async (data: ITwoFactorResetFormData) => {
    await reset2FAAction(data);
  };
  
	return (
		<form
      onSubmit={form.onSubmit(handleSubmit)}
      onReset={form.onReset}>
      <TextInput
        key={form.key(`code`)}
        size="md"
        label="Återställningskod"
        placeholder="Ange din återställningskod"
        {...form.getInputProps(`code`)} />
      <Button type="submit" fullWidth mt="xl" size="md" color="dark">
        Verifiera
      </Button>
		</form>
	);
}
