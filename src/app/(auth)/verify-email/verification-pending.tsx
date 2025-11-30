import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * VerificationPending component
 * Displays instructions for users waiting to verify their email
 */
export function VerificationPending() {
  return (
    <main>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a verification link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Please check your inbox and click the verification link to complete
            your registration.
          </p>
          <p>
            <strong>Didn&apos;t receive the email?</strong>
          </p>
          <ul>
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Wait a few minutes and try again</li>
          </ul>
        </CardContent>
        <CardFooter>
          <p>
            <a href="/login">Back to sign in</a>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
