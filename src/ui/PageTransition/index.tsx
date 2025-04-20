import { ReactNode } from "react";

import classes from "./PageTransition.module.css";

interface IProps {
  children: ReactNode | ReactNode[];
}

export function PageTransition({ children }: IProps) {

  return (
    <div className={classes.wrapper}>
      {children}
    </div>
  );
}
