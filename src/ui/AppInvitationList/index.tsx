"use client";

import { Table, TableTr, TableTd, TableThead, TableTh, TableTbody, Text, ButtonGroup } from "@mantine/core";
import dayjs from "dayjs";
import { getRoleName } from "@/lib/client/utils";
import { AcceptAppInvitationButton } from "../AcceptAppInvitationButton";
import { DeclineAppInvitationButton } from "../DeclineAppInvitationButton";
import { IAppInvitation } from "@/lib/server/db/types";

interface IProps {
  data: IAppInvitation[];
}

export function AppInvitationList({ data }: IProps) {

  const rows = data.map((row) => (
    <TableTr key={row.id}>
      <TableTd valign="top">
        <Text>{row.appName}</Text>
        <Text fz="xs">{row.appDescription}</Text>
      </TableTd>
      <TableTd valign="top">{getRoleName(row.roleSlug)}</TableTd>
      <TableTd valign="top">{row.expiresAt ? dayjs(row.expiresAt).format("YYYY-MM-DD HH:mm") : "-"}</TableTd>
      <TableTd valign="top" ta="right">
        <ButtonGroup>
          <AcceptAppInvitationButton data={row} />
          <DeclineAppInvitationButton data={row} />
        </ButtonGroup>
      </TableTd>
    </TableTr>
  ));

  return (
    <Table verticalSpacing="md">
      <TableThead>
        <TableTr>
          <TableTh>App</TableTh>
          <TableTh>Roll</TableTh>
          <TableTh>Giltig</TableTh>
          <TableTh></TableTh>
        </TableTr>
      </TableThead>
      <TableTbody>{rows}</TableTbody>
    </Table>
  );
}
