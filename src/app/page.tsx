import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPageClient from "./LandingPageClient";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return <LandingPageClient />;
}
