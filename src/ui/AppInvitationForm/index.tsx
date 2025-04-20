"use client";

import { createAppInvitationAction } from "@/app/(signed-in)/invitations/actions";
import { createAppInvitationFormDataSchema, ICreateAppInvitationFormData } from "@/app/(signed-in)/invitations/schema";
import { ROUTE_HOME } from "@/lib/client/constants";
import { IApp, IUser, IUserAppItem } from "@/lib/server/db/types";
import { TextInput, Button, Select, ComboboxData, Card, NumberInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ShowForUserAppRoles } from "../ShowForUserAppRoles";
import { TblRole } from "@/lib/types/role";

interface IProps {
  apps: IApp[];
  user: IUser;
  roles: TblRole[];
}

export function AppInvitationForm({ user, apps, roles }: IProps) {
  const router = useRouter();
  const [selectedApp, setSelectedApp] = useState<IUserAppItem>(user.apps[0]);

  const roleData: ComboboxData = useMemo(() => {
    return roles.map((e) => ({ label: e.name, value: e.slug }));
  }, [roles]);
  const appData: ComboboxData = useMemo(() => apps.map((e) => ({ label: e.name, value: e.slug })), [apps]);

  const form = useForm<ICreateAppInvitationFormData>({
    mode: "controlled",
    initialValues: {
      appSlug: user.apps[0].appSlug,
      partitionId: user.apps[0].externalPartitionId ?? undefined,
      organizationId: user.apps[0].externalOrganizationId ?? undefined,
      email: "",
      roleSlug: "user",
    },
    validate: {
      appSlug: (value) => {
        const field = createAppInvitationFormDataSchema.pick({ appSlug: true }).safeParse({ appSlug: value });
        if (!field.success) { return field.error.errors.at(0)?.message; }
      },
      partitionId: (value) => {
        const field = createAppInvitationFormDataSchema.pick({ partitionId: true }).safeParse({ partitionId: value });
        if (!field.success) { return field.error.errors.at(0)?.message; }
      },
      organizationId: (value) => {
        const field = createAppInvitationFormDataSchema.pick({ organizationId: true }).safeParse({ organizationId: value });
        if (!field.success) { return field.error.errors.at(0)?.message; }
      },
      email: (value) => {
        const field = createAppInvitationFormDataSchema.pick({ email: true }).safeParse({ email: value });
        if (!field.success) { return field.error.errors.at(0)?.message; }
      },
      roleSlug: (value) => {
        const field = createAppInvitationFormDataSchema.pick({ roleSlug: true }).safeParse({ roleSlug: value });
        if (!field.success) { return field.error.errors.at(0)?.message; }
      },
    },
    transformValues: (values) => {
      return {
        ...values,
        partitionId: values.partitionId || undefined,
        organizationId: values.organizationId || undefined,
      };
    }
  });
  
  const handleSubmit = async (data: ICreateAppInvitationFormData) => {
    const { notification, error } = await createAppInvitationAction(data);
    notifications.show(notification);
    form.setSubmitting(false);
    if (!error) {
      router.push(ROUTE_HOME);
    } else {
      console.log(error);
    }
  };

  // Update partition and organization when app changes
  form.watch("appSlug", (field) => {
    const app = user.apps.find((e) => e.appSlug === field.value)!;
    if (app?.externalPartitionId) {
      form.setFieldValue("partitionId", app.externalPartitionId);
    }
    if (app?.externalOrganizationId) {
      form.setFieldValue("organizationId", app.externalOrganizationId);
    }
    setSelectedApp(app);
  });

	return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Card>
        <Select
          key={form.key(`appSlug`)}
          label="App"
          placeholder="Välj app"
          data={appData}
          {...form.getInputProps(`appSlug`)} />
        <ShowForUserAppRoles appId={selectedApp?.appId} user={user} roles={["super_admin"]}>
          <NumberInput
            key={form.key(`partitionId`)}
            label="Partitionens id"
            description="Detta värde kan du hitta i appen i fråga. Om användaren skall kopplas till en ny partition, sätt 0"
            mt="md"
            placeholder="Ange partitionens id"
            {...form.getInputProps(`partitionId`)} />
        </ShowForUserAppRoles>
        <ShowForUserAppRoles appId={selectedApp?.appId} user={user} roles={["super_admin", "admin"]}>
          <NumberInput
            key={form.key(`organizationId`)}
            label="Företags id"
            mt="md"
            placeholder="Ange företagets id"
            description="Detta värde kan du hitta i appen i fråga. Om användaren skall kopplas till ett nytt företag, sätt 0"
            {...form.getInputProps(`organizationId`)} />
          </ShowForUserAppRoles>
      </Card>
      <Card mt="md">
        <TextInput
          key={form.key(`email`)}
          label="E-post"
          mt="md"
          placeholder="Ange E-post"
          {...form.getInputProps(`email`)} />
        <Select
          key={form.key(`roleSlug`)}
          label="Roll"
          mt="md"
          placeholder="Välj roll"
          data={roleData}
          {...form.getInputProps(`roleSlug`)} />
      </Card>
      <Button type="submit" fullWidth mt="lg" size="md" color="dark">
        Skicka
      </Button>
    </form>
  );
}
