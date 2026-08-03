import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPlaceholderPage() {
  return (
    <Card className="border-border/70 bg-card/80 shadow-soft backdrop-blur-xl">
      <CardHeader className="space-y-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <span className="font-display text-sm font-semibold">FH</span>
        </div>
        <div>
          <CardTitle className="font-display text-2xl tracking-tight">
            {APP_NAME}
          </CardTitle>
          <CardDescription className="mt-2 text-[15px] leading-relaxed">
            Authentication is intentionally deferred. Module 1 will add secure
            sign-in, sessions, and password reset.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 rounded-2xl border border-dashed border-border/80 bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>Planned in Module 1:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Credentials sign-in via Auth.js</li>
          <li>Password reset with Resend</li>
          <li>Session hardening & lockout basics</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button asChild className="min-h-11 w-full">
          <Link href="/">Continue to foundation shell</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
