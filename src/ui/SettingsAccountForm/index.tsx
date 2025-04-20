"use client";

import { updateUserDetailsAction } from "@/app/(signed-in)/account/actions";
import { IUpdateUserDetailsFormData, updateUserDetailsFormDataSchema } from "@/app/(signed-in)/account/schema";
import { ROUTE_HOME } from "@/lib/client/constants";
import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";

interface IProps {
  data: Partial<IUpdateUserDetailsFormData>;
}

export function SettingsAccountForm({ data }: IProps) {
  const router = useRouter()
  const form = useForm<IUpdateUserDetailsFormData>({
    mode: "controlled",
    initialValues: {
      firstName: data?.firstName || "",
      lastName: data?.lastName || "",
    },
    validate: {
      firstName: (value) => {
        const field = updateUserDetailsFormDataSchema.pick({ firstName: true }).safeParse({ firstName: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
      lastName: (value) => {
        const field = updateUserDetailsFormDataSchema.pick({ lastName: true }).safeParse({ lastName: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
    },
  });
  
  const handleSubmit = async (data: IUpdateUserDetailsFormData) => {
    const { notification, error } = await updateUserDetailsAction(data);
    notifications.show(notification);
    form.setSubmitting(false);
    if (!error) {
      router.push(ROUTE_HOME);
    } else {
      console.log(error);
    }
  };

	return (
    <form
      onSubmit={form.onSubmit(handleSubmit)}
      onReset={form.onReset}>
      <TextInput
        key={form.key(`firstName`)}
        label="Förnamn"
        placeholder="Ange ditt förnamn"
        {...form.getInputProps(`firstName`)} />
      <TextInput
        key={form.key(`lastName`)}
        mt="md"
        label="Efternamn"
        placeholder="Ange ditt efternamn"
        {...form.getInputProps(`lastName`)} />
      <Button type="submit" fullWidth mt="lg" size="md" color="dark">
        Spara
      </Button>
    </form>
  );
}
