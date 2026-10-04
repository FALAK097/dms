"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export function AuthModal({ open, onOpenChange }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      if (error) {
        console.error("Google sign-in error:", error);
        toast.error("Google sign-in is temporarily unavailable. Please try again later.");
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      toast.error("Google authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl">Get started with DMS</DialogTitle>
          <DialogDescription>
            Continue with Google to create your account or sign in
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button
            variant="outline"
            className="w-full gap-3 h-12 text-base cursor-pointer"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Image
                src="/images/google.svg"
                alt="Google"
                width={20}
                height={20}
              />
            )}
            Continue with Google
          </Button>
          <p className="text-balance text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link
              href="/privacy-policy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
