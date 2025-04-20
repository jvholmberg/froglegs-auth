import { Title, Text, TextInput, Button, Image } from "@mantine/core";

import classes from "./Banner.module.css";
import { ReactNode } from "react";

interface IProps {
  image?: string;
  title: string;
  subtitle: string;
  message: string;
  children?: ReactNode | ReactNode[];
}
export function Banner({
  image,
  title,
  subtitle,
  message,
  children,
}: IProps) {
  return (
    <div className={classes.wrapper}>
      <div className={classes.body}>
        <Title className={classes.title}>{title}</Title>
        <Text fw={500} fz="lg" mb={5}>{subtitle}</Text>
        <Text fz="sm" c="dimmed">{message}</Text>
        {children ? (
          <div className={classes.content}>
            {children}
          </div>
        ) : null}
      </div>
      {image ? (
        <Image
          src={image}
          alt={title}
          className={classes.image} />
      ) : null}
    </div>
  )
}
