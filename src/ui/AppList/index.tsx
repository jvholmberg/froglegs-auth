"use client";

import { IApp } from "@/lib/server/app";
import { Table, TableTr, TableTd, TableThead, TableTh, TableTbody, Button } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";

interface Props {
  data: IApp[];
}

export function AppList({ data }: Props) {

  const rows = data.map((row, index) => (
    <TableTr key={`${row.name}_${index}`}>
      <TableTd valign="top" fz="md">{row.name}</TableTd>
      <TableTd valign="top">{row.description}</TableTd>
      <TableTd valign="top" ta="right">
        {row.url && (
          <Button
            component={Link}
            href={row.url}
            fw={500}
            size="xs"
            color="dark"
            variant="filled"
            rightSection={<IconArrowRight />}>
            Gå till
          </Button>
        )}
      </TableTd>
    </TableTr>
  ));

  return (
    <Table verticalSpacing="md">
      <TableThead>
        <TableTr>
          <TableTh>Namn</TableTh>
          <TableTh>Beskrivning</TableTh>
          <TableTh></TableTh>
        </TableTr>
      </TableThead>
      <TableTbody>{rows}</TableTbody>
    </Table>
  );
}
