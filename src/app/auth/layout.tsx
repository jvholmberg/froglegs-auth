"use client";

import { Center, Paper } from "@mantine/core";
import classes from "./layout.module.css";
import Image from 'next/image';
import { useColorScheme } from "@mantine/hooks";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const colorScheme = useColorScheme();
	return (
    <div className={classes.wrapper}>
      <Paper className={classes.form} radius={0} p={30}>
        <Center>
          <Image
            src={colorScheme === 'dark' ? "/logo_neg.png" : "/logo.jpg"}
            alt="Kaxig - Creative web solutions"
            height={82}
            width={266} />
        </Center>
        {children}
      </Paper>
    </div>
	);
}
