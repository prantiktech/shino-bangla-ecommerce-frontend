import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterFlow } from "./RegisterFlow";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Nogod Bazar account to track orders and check out faster.",
};

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterFlow />
    </Suspense>
  );
}
