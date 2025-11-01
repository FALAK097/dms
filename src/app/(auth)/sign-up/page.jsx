import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata = {
  title: "Sign Up",
  description:
    "Create a new DMS account to start managing and organizing your documents with AI-powered chat.",
};

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Enter your details to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </main>
  );
}
