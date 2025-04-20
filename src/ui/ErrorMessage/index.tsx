"use client";

import { Box, Title, Text, Center } from "@mantine/core";

interface IProps {
  title: string | null;
  message: string | null;
}

export function ErrorMessage({
  title,
  message,
}: IProps) {

  return (
    <Box>
      <Center>
        <Title mt="xl" mb="xl" order={3}>{title}</Title>
      </Center>
      <Text ta="center">{message}</Text>
    </Box>
  );
}
