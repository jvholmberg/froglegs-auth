import Link from "next/link";
import { Card, Group, Badge, Button, Text, Image, CardSection } from "@mantine/core";
import { Role } from "@/lib/types/role";
import { getRoleName } from "@/lib/client/utils";

import  classes from "./AppCard.module.css";

interface IProps {
  imageUrl?: string;
  name: string | null;
  description: string | null;
  role?: Role | null;
  appHref?: string | null;
}

export function AppCard({
  imageUrl,
  name,
  description,
  role,
  appHref,
}: IProps) {

  return (
    <Card withBorder radius="md" className={classes.card}>
      <CardSection className={classes.imageSection}>
        <Image
          src={imageUrl || "/sigill_25.png"}
          alt={name || ""}
          height={75} />
      </CardSection>

      <Group justify="space-between" mt="md">
        <Text fw={500}>{name}</Text>
        {role ? (<Badge variant="outline" color="dark">{getRoleName(role)}</Badge>) : null}
      </Group>
      
      <Text mt="md" fz="xs" c="dimmed">
        {description}
      </Text>

      <CardSection className={classes.section}>
        {appHref ? (
          <Button
            w="100%"
            component={Link}
            href={appHref}
            fw={500}
            color="dark"
            variant="filled">
            Öppna
          </Button>
        ) : (
          <Button
            w="100%"
            fw={500}
            disabled={true}
            color="dark"
            variant="filled">
            Länk saknas
          </Button>
        )}
      </CardSection>
    </Card>
  );
}
