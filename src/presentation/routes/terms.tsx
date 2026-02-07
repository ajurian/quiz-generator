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

export const Route = createFileRoute("/terms")({
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
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
              <CardTitle className="text-3xl">Terms of Service</CardTitle>
              <p className="text-sm text-muted-foreground">
                Last updated: {lastUpdated}
              </p>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold mt-0">
                  1. Acceptance of Terms
                </h2>
                <p>
                  By accessing or using QuizGem (&quot;the Service&quot;), you
                  agree to be bound by these Terms of Service. If you do not
                  agree to these terms, please do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">
                  2. Description of Service
                </h2>
                <p>QuizGem is an AI-powered platform that enables users to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Generate quizzes automatically using Google Gemini AI based
                    on uploaded documents (PDF, text) or provided topics
                  </li>
                  <li>Create, manage, and organize educational quizzes</li>
                  <li>
                    Share quizzes publicly, via unlisted links, or keep them
                    private
                  </li>
                  <li>Take quizzes and track attempt history and scores</li>
                  <li>Explore publicly available quizzes created by others</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">3. User Accounts</h2>
                <p>
                  To access certain features, you must create an account. You
                  are responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Maintaining the confidentiality of your account credentials
                  </li>
                  <li>All activities that occur under your account</li>
                  <li>
                    Providing accurate and complete registration information
                  </li>
                  <li>Notifying us immediately of any unauthorized access</li>
                </ul>
                <p>
                  You may authenticate using email/password or third-party OAuth
                  providers (Google). By using OAuth, you authorize us to access
                  basic profile information as permitted by the provider.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">4. User Content</h2>
                <h3 className="text-lg font-medium">4.1 Your Content</h3>
                <p>
                  You retain ownership of content you upload or create,
                  including documents, quiz questions, and other materials
                  (&quot;User Content&quot;). By submitting User Content, you
                  grant us a non-exclusive, worldwide, royalty-free license to
                  use, store, and process your content solely to provide the
                  Service.
                </p>

                <h3 className="text-lg font-medium">
                  4.2 Content Responsibilities
                </h3>
                <p>You agree not to upload or create content that:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Infringes on intellectual property rights of others</li>
                  <li>
                    Contains illegal, harmful, threatening, or discriminatory
                    material
                  </li>
                  <li>Violates any applicable laws or regulations</li>
                  <li>Contains malware, viruses, or other harmful code</li>
                  <li>Impersonates others or misrepresents your affiliation</li>
                </ul>

                <h3 className="text-lg font-medium">
                  4.3 AI-Generated Content
                </h3>
                <p>
                  Quizzes generated by AI are created based on the content you
                  provide. While we strive for accuracy, AI-generated questions
                  may contain errors or inaccuracies. You are responsible for
                  reviewing and verifying quiz content before sharing or using
                  it for educational purposes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">
                  5. Quiz Visibility and Sharing
                </h2>
                <p>Quizzes can be set to three visibility levels:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Private:</strong> Only you can view and access
                  </li>
                  <li>
                    <strong>Unlisted:</strong> Anyone with the link can access,
                    but not discoverable in public listings
                  </li>
                  <li>
                    <strong>Public:</strong> Discoverable by all users and
                    accessible by anyone
                  </li>
                </ul>
                <p>
                  You are responsible for the visibility settings you choose and
                  the content you share publicly.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">6. Acceptable Use</h2>
                <p>You agree not to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Use the Service for any unlawful purpose or in violation of
                    these Terms
                  </li>
                  <li>
                    Attempt to gain unauthorized access to the Service or its
                    systems
                  </li>
                  <li>
                    Interfere with or disrupt the Service or servers/networks
                    connected to it
                  </li>
                  <li>
                    Use automated means to access the Service without permission
                  </li>
                  <li>
                    Reverse engineer, decompile, or attempt to extract source
                    code
                  </li>
                  <li>
                    Use the AI features to generate harmful, misleading, or
                    inappropriate content
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">
                  7. Intellectual Property
                </h2>
                <p>
                  The Service, including its design, features, and underlying
                  technology (excluding User Content), is owned by us and
                  protected by intellectual property laws. You may not copy,
                  modify, distribute, or create derivative works without our
                  express permission.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">
                  8. Third-Party Services
                </h2>
                <p>
                  The Service integrates with third-party services including:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Google Gemini AI:</strong> For quiz generation
                  </li>
                  <li>
                    <strong>Google OAuth:</strong> For authentication
                  </li>
                  <li>
                    <strong>Cloud storage providers:</strong> For file storage
                  </li>
                </ul>
                <p>
                  Your use of these services is subject to their respective
                  terms and privacy policies.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">
                  9. Disclaimer of Warranties
                </h2>
                <p>
                  THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
                  AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
                  IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE
                  UNINTERRUPTED, ERROR-FREE, OR SECURE. AI-GENERATED CONTENT MAY
                  CONTAIN INACCURACIES AND SHOULD NOT BE RELIED UPON AS THE SOLE
                  SOURCE OF INFORMATION FOR EDUCATIONAL OR PROFESSIONAL
                  PURPOSES.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">
                  10. Limitation of Liability
                </h2>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE
                  FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                  PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
                  INCURRED DIRECTLY OR INDIRECTLY, ARISING FROM YOUR USE OF THE
                  SERVICE.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">11. Termination</h2>
                <p>
                  We may suspend or terminate your access to the Service at any
                  time for violation of these Terms or for any other reason at
                  our discretion. Upon termination, your right to use the
                  Service ceases immediately. You may delete your account at any
                  time through account settings.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">12. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these Terms at any time. We
                  will notify users of material changes by posting the updated
                  Terms on this page with a new &quot;Last updated&quot; date.
                  Continued use of the Service after changes constitutes
                  acceptance of the modified Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">13. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance
                  with applicable laws, without regard to conflict of law
                  principles.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">14. Contact</h2>
                <p>
                  If you have questions about these Terms, please contact us
                  through the application or at the contact information provided
                  on our website.
                </p>
              </section>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-8">
            See also:{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
