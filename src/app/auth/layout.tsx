import { Paper } from "@mantine/core";
import classes from "./layout.module.css";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
	return (
    <div className={classes.wrapper}>
      <Paper className={classes.form} radius={0} p={30}>
        {children}
      </Paper>
    </div>
	);
}
