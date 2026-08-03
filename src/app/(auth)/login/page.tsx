import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";
import { PageSkeleton } from "@/components/feedback";

export default function LoginPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={3} />}>
      <LoginForm />
    </Suspense>
  );
}
