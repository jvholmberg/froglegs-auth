"use client";

import { Button } from "@mantine/core";
import { declineAppInvitationFormDataSchema, IDeclineAppInvitationFormData } from "@/actions/invitation/schema";
import { useForm } from "@mantine/form";
import { declineAppInvitationAction } from "@/actions/invitation";
import { ROUTE_SETTINGS_INVITATIONS } from "@/lib/client/constants";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";

import classes from "./DeclineAppInvitationButton.module.css";
import { IAppInvitation } from "@/lib/server/db/types";

interface Props {
  data: IAppInvitation;
}

export function DeclineAppInvitationButton(props: Props) {
  const router = useRouter();
  const form = useForm<IDeclineAppInvitationFormData>({
    mode: "controlled",
    initialValues: {
      id: props.data.id,
    },
    validate: {
      id: (value) => {
        const field = declineAppInvitationFormDataSchema.pick({ id: true }).safeParse({ id: value });
        if (!field.success) {
          return field.error.errors.at(0)?.message;
        }
      },
    },
  });

  const handleSubmit = async (data: IDeclineAppInvitationFormData) => {
    const { notification } = await declineAppInvitationAction(data);
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
        color="red"
        variant="filled">
        Ta bort
      </Button>
		</form>
	);
}
