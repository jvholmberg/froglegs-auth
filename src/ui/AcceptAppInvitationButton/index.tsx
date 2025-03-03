"use client";

import { Button } from "@mantine/core";
import { acceptAppInvitationFormDataSchema, IAcceptAppInvitationFormData } from "@/actions/invitation/schema";
import { useForm } from "@mantine/form";
import { acceptAppInvitationAction } from "@/actions/invitation";
import { ROUTE_SETTINGS_INVITATIONS } from "@/lib/client/constants";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";

import classes from "./AcceptAppInvitationButton.module.css";
import { IAppInvitation } from "@/lib/server/db/types";

interface Props {
  data: IAppInvitation;
}

export function AcceptAppInvitationButton(props: Props) {
  const router = useRouter();
  const form = useForm<IAcceptAppInvitationFormData>({
    mode: "controlled",
    initialValues: {
      id: props.data.id,
    },
    validate: {
      id: (value) => {
        const field = acceptAppInvitationFormDataSchema.pick({ id: true }).safeParse({ id: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
    },
  });

  const handleSubmit = async (data: IAcceptAppInvitationFormData) => {
    const { notification } = await acceptAppInvitationAction(data);
    notifications.show(notification);
    router.push(ROUTE_SETTINGS_INVITATIONS);
  };
  
	return (
		<form
      onSubmit={form.onSubmit(handleSubmit)}
      className={classes.form}>
      <Button
        type="submit"
        fw={500}
        size="xs"
        mr="sm"
        color="dark"
        variant="filled">
        Acceptera
      </Button>
		</form>
	);
}
