"use client";

import { signoutAction } from "@/actions/sign-out";
import { Button } from "@mantine/core";
import { ReactNode, useActionState } from "react";
import { useColorScheme } from "@mantine/hooks";

const initialState = {
	message: ""
};

interface Props {
  children?: ReactNode | ReactNode[];
}

export function SignOutLink({ children }: Props) {
	const [, action] = useActionState(signoutAction, initialState);
	return (
		<form action={action}>
      <Button
        type="submit"
        variant="transparent"
        color="text"
        td="underline"
        fw={500}
        fz="md">
        {children}
      </Button>
		</form>
	);
}
