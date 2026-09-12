import { Suspense } from "react";
import { AuthRouteSync } from "@/components/auth/AuthRouteSync";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AuthRouteSync>{children}</AuthRouteSync>
    </Suspense>
  );
}
