"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Shield, Zap } from "lucide-react";

export function HomeContent() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Document Management System
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Organize, manage, and chat with your documents using AI-powered
            intelligence
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button
            onClick={() => router.push("/dashboard")}
            size="lg"
            className="w-full sm:w-auto min-w-[140px]"
          >
            Get Started
          </Button>
          <Button
            onClick={() => router.push("/sign-up")}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto min-w-[140px]"
          >
            Sign Up
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
          <Card className="p-6 space-y-2">
            <div className="flex justify-center">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold">Smart Organization</h3>
            <p className="text-sm text-muted-foreground">
              Keep all your documents organized in one secure place
            </p>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex justify-center">
              <div className="p-3 rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold">AI-Powered Chat</h3>
            <p className="text-sm text-muted-foreground">
              Chat with your documents and get instant answers
            </p>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex justify-center">
              <div className="p-3 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold">Secure & Private</h3>
            <p className="text-sm text-muted-foreground">
              Your documents are encrypted and protected
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
