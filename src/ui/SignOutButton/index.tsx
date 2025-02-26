"use client";

import { signoutAction } from "@/actions/sign-out";
import { Button } from "@mantine/core";
import { useActionState } from "react";

const initialState = {
	message: ""
};

export function SignOutButton() {
	const [, action] = useActionState(signoutAction, initialState);
	return (
		<form action={action}>
      <Button type="submit" color="red">Logga ut</Button>
		</form>
	);
}
