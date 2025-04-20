"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import classes from "./HeaderLink.module.css";

interface IProps {
  href: string;
  exact?: boolean;
  children: ReactNode | ReactNode[];
}
export function HeaderLink({
  href,
  exact,
  children,
}: IProps) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname.startsWith(href);
  const className = isActive
    ? [classes.link, classes.linkActive].join(" ")
    : classes.link;
  return (
    <Link
      href={href}
      className={className}>
      {children}
    </Link>
  )
}
