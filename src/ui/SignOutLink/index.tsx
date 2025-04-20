"use client";

import { signoutAction } from "@/app/(signed-in)/actions";
import { Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { ReactNode } from "react";

interface IProps {
  children?: ReactNode | ReactNode[];
}

export function SignOutLink({ children }: IProps) {
  const form = useForm({
    mode: "controlled",
    initialValues: {
    },
    validate: {
    },
  });

  const handleSubmit = async () => {
    const { notification } = await signoutAction();
    notifications.show(notification);
  };
	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
      <Button
        type="submit"
        variant="transparent"
        color="text"
        td="underline"
        fw={700}
        fz="md">
        {children}
      </Button>
		</form>
	);
}
