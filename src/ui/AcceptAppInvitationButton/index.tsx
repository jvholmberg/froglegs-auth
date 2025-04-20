"use client";

import { Button } from "@mantine/core";
import { acceptAppInvitationFormDataSchema, IAcceptAppInvitationFormData } from "@/app/(signed-in)/invitations/schema";
import { useForm } from "@mantine/form";
import { acceptAppInvitationAction } from "@/app/(signed-in)/invitations/actions";
import { ROUTE_INVITATIONS } from "@/lib/client/constants";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";

import classes from "./AcceptAppInvitationButton.module.css";
import { IAppInvitation } from "@/lib/server/db/types";
import { IconCheck } from "@tabler/icons-react";

interface IProps {
  data: IAppInvitation;
}

export function AcceptAppInvitationButton(props: IProps) {
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
    router.push(ROUTE_INVITATIONS);
  };
  
	return (
		<form
      onSubmit={form.onSubmit(handleSubmit)}
      className={classes.form}>
      <Button
        type="submit"
        mr="xs"
        size="xs"
        color="dark"
        variant="subtle"
        leftSection={<IconCheck size={16} />}>
        Acceptera
      </Button>
		</form>
	);
}
