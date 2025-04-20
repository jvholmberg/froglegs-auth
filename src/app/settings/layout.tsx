import { Center, Paper } from "@mantine/core";
import classes from "./layout.module.css";
import { Image } from "@mantine/core";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
	return (
    <div className={classes.wrapper}>
      <Paper className={classes.form} radius={0} p={30}>
        <Center>
          <Image
            src="/logo_25.png"
            alt="Kaxig - Creative web solutions"
            height={140} />
        </Center>
        {children}
      </Paper>
    </div>
	);
}
