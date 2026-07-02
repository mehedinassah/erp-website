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

  let result: Awaited<ReturnType<typeof verifyCredentials>>;
  try {
    result = await verifyCredentials(email, password);
  } catch {
    return {
      error: "Sign-in is temporarily unavailable. Please try again in a moment.",
    };
  }
  if (!result.ok) {
    if (result.reason === "suspended") {
      return {
        error:
          "This account is suspended. Please contact support to reactivate your subscription.",
      };
    }
    return { error: "Invalid email or password." };
  }

  try {
    await createSession({
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      tenantId: result.user.tenantId,
      sessionVersion: result.user.sessionVersion,
    });
  } catch {
    return {
      error: "Sign-in is temporarily unavailable. Please try again in a moment.",
    };
  }
  redirect("/dashboard");
}
