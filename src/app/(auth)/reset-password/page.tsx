import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { PageSkeleton } from "@/components/feedback";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={4} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
