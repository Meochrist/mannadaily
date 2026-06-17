import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import OnboardingClient from "@/components/onboarding/OnboardingClient";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <OnboardingClient
      userId={session.user.id}
      userName={session.user.name || "Ami"}
    />
  );
}
