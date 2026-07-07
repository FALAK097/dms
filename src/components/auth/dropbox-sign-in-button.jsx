"use client";

import { useState } from "react";
import { linkDropboxAccount } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DropboxSignInButton({
  callbackURL = "/settings",
  variant = "outline",
  className = "",
  children = "Connect",
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);

  const handleDropboxConnect = async () => {
    try {
      setLoading(true);
      const { data, error } = await linkDropboxAccount(callbackURL);

      if (error) {
        console.error("Dropbox connection error:", error);
        toast.error(error.message || "Failed to connect to Dropbox");
        setLoading(false);
      } else {
        toast.success("Connecting to Dropbox...");
      }
    } catch (error) {
      console.error("Dropbox connection error:", error);
      toast.error(error.message || "Failed to connect to Dropbox");
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDropboxConnect}
      disabled={loading}
      variant={variant}
      className={className}
    >
      {loading ? "Connecting..." : children}
    </Button>
  );
}
