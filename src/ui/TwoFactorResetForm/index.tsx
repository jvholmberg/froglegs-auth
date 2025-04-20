"use client";

import { reset2FAAction } from "@/app/(anonymous)/2fa/actions";
import { ITwoFactorResetFormData, twoFactorResetFormDataSchema } from "@/app/(anonymous)/2fa/schema";
import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

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
    const { notification } = await reset2FAAction(data);
    notifications.show(notification);
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
      <Button type="submit" fullWidth mt="lg" size="md" color="dark">
        Verifiera
      </Button>
		</form>
	);
}
