"use client";

import { Table, TableTr, TableTd, TableThead, TableTh, TableTbody, Text, Menu, MenuDivider, MenuDropdown, MenuItem, MenuLabel, MenuTarget, ActionIcon, Select, ComboboxData, Group, Anchor, PasswordInput } from "@mantine/core";
import { getRoleName } from "@/lib/client/utils";
import { IUser } from "@/lib/server/db/types";
import { IconTrash, IconKey, IconCrown, IconPencil } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { dangerouslySetUserPasswordAction, deleteUserAction, updateUserRoleAction } from "@/app/(signed-in)/admin/actions";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Role, TblRole } from "@/lib/types/role";

interface IProps {
  data: IUser[];
  roles: TblRole[];
}

export function AdminUserList({ data, roles }: IProps) {
  const router = useRouter();
  const selectedRoleSlug = useRef<Role | null>(null); 
  const password = useRef<string>("")
  const mappedRoles: ComboboxData = roles.map((e) => {
    return {
      label: e.name,
      value: e.slug,
    };
  });
  
  const handleResetPassword = (user: IUser) => {
    password.current = "";
    modals.openConfirmModal({
      title: `Ändra lösenord för ${user.email}`,
      children: (
        <PasswordInput 
          placeholder="Nytt Lösenord" 
          id="your-password"
          onChange={(e) => {
            password.current = e.currentTarget.value;
          }}
        />
      ),
      confirmProps: { color: "dark" },
      labels: { confirm: 'Uppdatera Lösenord', cancel: 'Tillbaka' },
      onConfirm: async () => {
        const { error, notification } = await dangerouslySetUserPasswordAction(user.id, password.current);
        notifications.show(notification);
        if (!error) {
          router.refresh();
        }
      },
    });
  };
  
  const handleChangeRole = (user: IUser) => {
    selectedRoleSlug.current = user.role;
    modals.openConfirmModal({
      title: `Ändra roll för ${user.email}`,
      children: (
        <Select
          label="Roll"
          placeholder="Välj roll"
          data={mappedRoles}
          onChange={(e) => {
            selectedRoleSlug.current = e as Role | null;
          }} />
      ),
      confirmProps: { color: "dark" },
      labels: { confirm: 'Uppdatera', cancel: 'Tillbaka' },
      onConfirm: async () => {
        const { error, notification } = await updateUserRoleAction(user.id, selectedRoleSlug.current);
        notifications.show(notification);
        if (!error) {
          router.refresh();
        }
      },
    });
  };

  const handleDelete = (user: IUser) => {
    modals.openConfirmModal({
      title: `Du är på väg att ta ${user.email}`,
      children: (
        <Text size="sm">
          Bekräfta att du vill ta bort användaren.
        </Text>
      ),
      confirmProps: { color: "red" },
      labels: { confirm: 'Ta bort', cancel: 'Tillbaka' },
      onConfirm: async () => {
        const { error, notification } = await deleteUserAction(user.id);
        notifications.show(notification);
        if (!error) {
          router.refresh();
        }
      },
    });
  };

  const rows = data.map((row, i) => (
    <TableTr key={i}>
      <TableTd>{row.lastName}</TableTd>
      <TableTd>{row.firstName}</TableTd>
      <TableTd>{row.email}</TableTd>
      <TableTd>{getRoleName(row.role)}</TableTd>
      <TableTd>
        <Menu shadow="md" width={200}>
          <MenuTarget>
            <ActionIcon size="lg" variant="subtle" color="dark">
              <IconPencil />  
            </ActionIcon>
          </MenuTarget>

          <MenuDropdown>
            <MenuLabel>{row.email}</MenuLabel>
            <MenuItem
              fz="md"
              leftSection={<IconKey size={14}/>}
              onClick={() => handleResetPassword(row)}>
              Återställ lösenord
            </MenuItem>
            <MenuItem
              fz="md"
              leftSection={<IconCrown size={14} />}
              onClick={() => handleChangeRole(row)}>
              Ändra roll
            </MenuItem>
            <MenuDivider />
            <MenuItem
              color="red"
              fz="md"
              leftSection={<IconTrash size={14} />}
              onClick={() => handleDelete(row)}>
              Ta bort användare
            </MenuItem>
          </MenuDropdown>
        </Menu>
      </TableTd>
    </TableTr>
  ));

  return (
    <Table verticalSpacing="md">
      <TableThead>
        <TableTr>
          <TableTh>Efternamn</TableTh>
          <TableTh>Förnamn</TableTh>
          <TableTh>E-post</TableTh>
          <TableTh>Roll</TableTh>
          <TableTh></TableTh>
        </TableTr>
      </TableThead>
      <TableTbody>{rows}</TableTbody>
    </Table>
  );
}
