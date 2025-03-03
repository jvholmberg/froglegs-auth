"use client";

import { Table, TableTr, TableTd, TableThead, TableTh, TableTbody, Button } from "@mantine/core";
import dayjs from "dayjs";
import { getRoleName } from "@/lib/client/utils";
import { AcceptAppInvitationButton } from "../AcceptAppInvitationButton";
import { DeclineAppInvitationButton } from "../DeclineAppInvitationButton";
import { IAppInvitation } from "@/lib/server/db/types";

interface Props {
  data: IAppInvitation[];
}

export function AppInvitationList({ data }: Props) {

  const rows = data.map((row) => (
    <TableTr key={row.id}>
      <TableTd valign="top" fz="md">{row.appName}</TableTd>
      <TableTd valign="top">{row.appDescription}</TableTd>
      <TableTd valign="top">{getRoleName(row.role)}</TableTd>
      <TableTd valign="top">{row.expiresAt ? dayjs(row.expiresAt).format("YYYY-MM-DD HH:mm") : ""}</TableTd>
      <TableTd valign="top" ta="right">
        <AcceptAppInvitationButton data={row} />
        <DeclineAppInvitationButton data={row} />
      </TableTd>
    </TableTr>
  ));

  return (
    <Table verticalSpacing="md">
      <TableThead>
        <TableTr>
          <TableTh>Namn</TableTh>
          <TableTh>Beskrivning</TableTh>
          <TableTh>Roll</TableTh>
          <TableTh>Giltighetstid</TableTh>
          <TableTh></TableTh>
        </TableTr>
      </TableThead>
      <TableTbody>{rows}</TableTbody>
    </Table>
  );
}
