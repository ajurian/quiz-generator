import { createFileRoute, Link } from "@tanstack/react-router";
import { AppNavbar } from "@/presentation/components/shared";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const { session } = Route.useRouteContext();
  const lastUpdated = "February 1, 2026";

  return (
    <div className="min-h-screen bg-muted/20">
      <AppNavbar user={session?.user} variant="default" />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
              <p className="text-sm text-muted-foreground">
                Last updated: {lastUpdated}
              </p>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold mt-0">1. Introduction</h2>
                <p>
                  QuizGem ("we," "us," or "our") is committed to protecting your
                  privacy. This Privacy Policy explains how we collect, use,
                  disclose, and safeguard your information when you use our
                  AI-powered quiz generation service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">
                  2. Information We Collect
                </h2>

                <h3 className="text-lg font-medium">
                  2.1 Information You Provide
                </h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Account Information:</strong> Name, email address,
                    and password when you register, or profile information from
                    Google if you use OAuth authentication
                  </li>
                  <li>
                    <strong>Uploaded Content:</strong> Documents (PDFs, text
                    files) you upload for quiz generation
                  </li>
                  <li>
                    <strong>Quiz Content:</strong> Quizzes you create, including
                    questions, answers, and topics
                  </li>
                  <li>
                    <strong>Quiz Responses:</strong> Your answers when taking
                    quizzes, scores, and completion data
                  </li>
                </ul>

                <h3 className="text-lg font-medium">
                  2.2 Automatically Collected Information
                </h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Usage Data:</strong> Quiz attempt timestamps,
                    duration, and interaction patterns
                  </li>
                  <li>
                    <strong>Device Information:</strong> Browser type, operating
                    system, and device identifiers
                  </li>
                  <li>
                    <strong>Log Data:</strong> IP addresses, access times, and
                    pages viewed
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">
                  3. How We Use Your Information
                </h2>
                <p>We use collected information to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Provide the Service:</strong> Generate quizzes using
                    AI, store your content, and track quiz attempts
                  </li>
                  <li>
                    <strong>Authenticate Users:</strong> Verify your identity
                    and secure your account
                  </li>
                  <li>
                    <strong>Process AI Requests:</strong> Send your uploaded
                    content to Google Gemini AI for quiz generation
                  </li>
                  <li>
                    <strong>Improve the Service:</strong> Analyze usage patterns
                    to enhance features and user experience
                  </li>
                  <li>
                    <strong>Communicate:</strong> Send service-related
                    notifications and updates
                  </li>
                  <li>
                    <strong>Ensure Security:</strong> Detect, prevent, and
                    respond to fraud or security issues
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">
                  4. AI Processing and Third-Party Services
                </h2>

                <h3 className="text-lg font-medium">4.1 Google Gemini AI</h3>
                <p>
                  When you generate quizzes, your uploaded documents and topics
                  are processed by Google Gemini AI. This data is sent to
                  Google's servers for processing. Please review{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google's Privacy Policy
                  </a>{" "}
                  for information on how they handle data.
                </p>

                <h3 className="text-lg font-medium">4.2 Authentication</h3>
                <p>
                  If you sign in with Google, we receive basic profile
                  information (name, email, profile picture) as authorized by
                  you. We do not access your Google account beyond
                  authentication.
                </p>

                <h3 className="text-lg font-medium">
                  4.3 Cloud Infrastructure
                </h3>
                <p>
                  We use cloud service providers for hosting, storage, and
                  database services. Your data may be stored on servers operated
                  by these providers in accordance with their security
                  practices.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">5. Data Sharing</h2>
                <p>We may share your information in the following cases:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Public Quizzes:</strong> If you set a quiz to
                    "public," other users can view the quiz content and your
                    display name as the creator
                  </li>
                  <li>
                    <strong>Unlisted Quizzes:</strong> Anyone with the direct
                    link can access the quiz content
                  </li>
                  <li>
                    <strong>Service Providers:</strong> Third-party vendors who
                    assist in operating the Service (hosting, AI processing)
                    under confidentiality agreements
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by law,
                    legal process, or to protect our rights and safety
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> In connection with a
                    merger, acquisition, or sale of assets
                  </li>
                </ul>
                <p>
                  We do not sell your personal information to third parties.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">6. Data Retention</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Account Data:</strong> Retained while your account
                    is active and for a reasonable period after deletion for
                    legal compliance
                  </li>
                  <li>
                    <strong>Uploaded Documents:</strong> Processed for quiz
                    generation and may be retained temporarily for service
                    improvement; you can request deletion
                  </li>
                  <li>
                    <strong>Quiz Content:</strong> Retained until you delete the
                    quiz or your account
                  </li>
                  <li>
                    <strong>Attempt History:</strong> Retained to provide you
                    with progress tracking and statistics
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">7. Your Rights</h2>
                <p>
                  Depending on your jurisdiction, you may have the right to:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Access:</strong> Request a copy of your personal
                    data
                  </li>
                  <li>
                    <strong>Correction:</strong> Update or correct inaccurate
                    information
                  </li>
                  <li>
                    <strong>Deletion:</strong> Request deletion of your account
                    and associated data
                  </li>
                  <li>
                    <strong>Portability:</strong> Receive your data in a
                    portable format
                  </li>
                  <li>
                    <strong>Objection:</strong> Object to certain processing of
                    your data
                  </li>
                  <li>
                    <strong>Withdraw Consent:</strong> Revoke previously given
                    consent
                  </li>
                </ul>
                <p>
                  To exercise these rights, please contact us through the
                  application or delete your account through account settings.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">8. Data Security</h2>
                <p>
                  We implement appropriate technical and organizational measures
                  to protect your information, including:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Encryption of data in transit (HTTPS/TLS)</li>
                  <li>Secure password hashing</li>
                  <li>Access controls and authentication</li>
                  <li>Regular security assessments</li>
                </ul>
                <p>
                  However, no method of transmission or storage is 100% secure.
                  We cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">
                  9. Cookies and Tracking
                </h2>
                <p>We use essential cookies and similar technologies to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Maintain your authenticated session</li>
                  <li>Remember your preferences (e.g., theme settings)</li>
                  <li>Ensure security and prevent fraud</li>
                </ul>
                <p>
                  We do not use third-party advertising or tracking cookies.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">
                  10. Children's Privacy
                </h2>
                <p>
                  The Service is not directed to children under 13. We do not
                  knowingly collect personal information from children under 13.
                  If you believe we have collected such information, please
                  contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">
                  11. International Data Transfers
                </h2>
                <p>
                  Your information may be transferred to and processed in
                  countries other than your own. These countries may have
                  different data protection laws. We take steps to ensure your
                  data receives adequate protection in accordance with this
                  Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">
                  12. Changes to This Policy
                </h2>
                <p>
                  We may update this Privacy Policy periodically. We will notify
                  you of material changes by posting the new policy on this page
                  with an updated "Last updated" date. Your continued use of the
                  Service after changes constitutes acceptance of the updated
                  policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">13. Contact Us</h2>
                <p>
                  If you have questions or concerns about this Privacy Policy or
                  our data practices, please contact us through the application
                  or at the contact information provided on our website.
                </p>
              </section>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-8">
            See also:{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
