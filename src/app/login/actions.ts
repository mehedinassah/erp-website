"use server";

import { redirect } from "next/navigation";
import { verifyCredentials, createSession } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@") || !password) {
    return { error: "Enter a valid email and password." };
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    return { error: "Invalid email or password." };
  }

  await createSession(user);
  redirect("/");
}
