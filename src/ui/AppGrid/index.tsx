"use client";

import { IApp } from "@/lib/server/db/types";
import { Grid, GridCol } from "@mantine/core";
import { AppCard } from "../AppCard";
import { Banner } from "../Banner";

interface IProps {
  data: IApp[];
}

export function AppGrid({ data }: IProps) {

  const rows = data.map((row, index) => (
    <GridCol span={{ xs: 12, sm: 6 }} key={`${row.slug}_${index}`}>
      <AppCard
        name={row.name}
        description={row.description}
        appHref={row.url}
        role={null} />
    </GridCol>
  ));

  if (!rows.length) {
    return (
      <Banner
        title="Här var det tomt..."
        subtitle="Det ser inte ut som du har några appar tillgängliga"
        message="Testa klicka på menyalternativet och se om du har några inbjudningar" />
    );
  }

  return (
    <Grid>
      {rows}
    </Grid>
  );
}
