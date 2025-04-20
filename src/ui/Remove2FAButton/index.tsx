"use client";

import { Text, Button } from "@mantine/core";
import { TWO_FACTOR_MANDATORY } from "@/lib/client/constants";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import { remove2FAAction } from "@/app/settings/actions";
import { ISession, ISessionFlags, IUser } from "@/lib/server/db/types";
import { modals } from "@mantine/modals";

interface IProps {
  user: IUser | null;
  session: (ISession & ISessionFlags) | null;
}
export function Remove2FAButton({
  user,
  session,
}: IProps) {
  const router = useRouter();

  const handleSubmit = async () => {
    modals.openConfirmModal({
      title: `Du är på väg att ta bort 2-faktor autentisering`,
      children: (
        <Text size="sm">
          Bekräfta att du vill ta bort 2-faktor autentisering.
          Ditt kontos säkerhet kommer att minska om du gör detta.
        </Text>
      ),
      confirmProps: { color: "red" },
      labels: { confirm: 'Ta bort', cancel: 'Tillbaka' },
      onConfirm: async () => {
        const { error, notification } = await remove2FAAction();
        notifications.show(notification);
        if (!error) {
          router.refresh();
        }
      },
    });
  };

  if (TWO_FACTOR_MANDATORY) {
    return null;
  }

  if (!user?.registered2FA || !session?.twoFactorVerified) {
    return null;
  }
  
	return (
    <Button
      mt="md"
      w="100%"
      fw={500}
      color="dark"
      variant="filled"
      onClick={handleSubmit}>
      Ta bort 2-faktors autentisering
    </Button>
	);
}
