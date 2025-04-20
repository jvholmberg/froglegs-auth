"use client";

import { Button } from "@mantine/core";
import { declineAppInvitationFormDataSchema, IDeclineAppInvitationFormData } from "@/app/(signed-in)/invitations/schema";
import { useForm } from "@mantine/form";
import { declineAppInvitationAction } from "@/app/(signed-in)/invitations/actions";
import { ROUTE_INVITATIONS } from "@/lib/client/constants";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import { IAppInvitation } from "@/lib/server/db/types";

import classes from "./DeclineAppInvitationButton.module.css";
import { IconTrash } from "@tabler/icons-react";

interface IProps {
  data: IAppInvitation;
}

export function DeclineAppInvitationButton(props: IProps) {
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
    router.push(ROUTE_INVITATIONS);
  };
  
	return (
		<form
      onSubmit={form.onSubmit(handleSubmit)}
      className={classes.form}>
      <Button
        type="submit"
        size="xs"
        color="red"
        leftSection={<IconTrash size={16} />}
        variant="subtle">
        Ta bort
      </Button>
		</form>
	);
}
