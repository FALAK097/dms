import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for DMS - Learn how we collect, store, and protect your data including Dropbox integration details.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Link>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground mb-12">
            Last updated: November 1, 2025
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">1. Overview</h2>
            <p className="leading-relaxed mb-4">
              DMS (Document Management System) by Falak Gala provides a secure
              way for users to upload, organize, and process their documents in
              the cloud. This policy explains how DMS collects, stores, and uses
              data when you use the application or connect your Dropbox account.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">
              2. Information We Collect
            </h2>
            <p className="leading-relaxed mb-4">
              We collect and store the following information to operate the app:
            </p>

            <h3 className="text-xl font-semibold mb-3">Account Information:</h3>
            <p className="leading-relaxed mb-6">
              When you sign up, we store your name, email address, and an
              encrypted password.
            </p>

            <h3 className="text-xl font-semibold mb-3">
              Documents & Metadata:
            </h3>
            <p className="leading-relaxed mb-2">
              Files you upload or import are processed and stored securely for
              your use inside DMS. We do not access or modify your files without
              your explicit action.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              Dropbox Integration Data:
            </h3>
            <p className="leading-relaxed mb-3">
              When you connect Dropbox, we receive an OAuth access token from
              Dropbox. This token is stored securely and used only to:
            </p>
            <ul className="list-disc pl-6 mb-3 space-y-1">
              <li>Retrieve file metadata</li>
              <li>Read or import files you explicitly select</li>
              <li>Perform actions you authorize inside DMS</li>
            </ul>
            <p className="leading-relaxed mb-6">
              We never store your Dropbox credentials or share your files with
              third parties.
            </p>

            <h3 className="text-xl font-semibold mb-3">Usage Data:</h3>
            <p className="leading-relaxed mb-4">
              Anonymous usage data (like app performance or error logs) may be
              collected to improve the service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">
              3. How We Use Your Information
            </h2>
            <p className="leading-relaxed mb-3">We use your information to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Provide and improve the DMS app</li>
              <li>
                Enable document storage, management, and Dropbox integration
              </li>
              <li>Communicate updates or bug fixes</li>
              <li>Maintain security and prevent unauthorized access</li>
            </ul>
            <p className="leading-relaxed">
              We never sell or share your personal data with advertisers or
              third parties.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">
              4. Data Storage and Security
            </h2>
            <p className="leading-relaxed mb-4">
              All stored data (including Dropbox tokens) is encrypted and
              protected using industry-standard practices. You can revoke
              Dropbox access at any time from your Dropbox account settings or
              within DMS.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">
              5. Third-Party Services
            </h2>
            <p className="leading-relaxed">
              DMS integrates with Dropbox for file management. Use of Dropbox
              services is governed by{" "}
              <a
                href="https://www.dropbox.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Dropbox&apos;s Privacy Policy
              </a>
              .
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="leading-relaxed mb-3">You may:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Delete your DMS account at any time</li>
              <li>Revoke Dropbox access via Dropbox or DMS</li>
              <li>Request data deletion by contacting us</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">7. Contact</h2>
            <p className="leading-relaxed mb-3">
              If you have any questions about this Privacy Policy or your data,
              contact:
            </p>
            <p className="mb-2">
              <a
                href="mailto:hi@falakgala.dev"
                className="text-primary hover:underline"
              >
                hi@falakgala.dev
              </a>
            </p>
            <p>
              <a
                href="https://dms.falakgala.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://dms.falakgala.dev
              </a>
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
