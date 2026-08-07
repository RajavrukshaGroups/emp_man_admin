import { ResumeOnboarding } from "@/features/onboarding/components/resume-onboarding";

interface ResumeOnboardingPageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function ResumeOnboardingPage({
  params,
}: ResumeOnboardingPageProps) {
  const { userId } = await params;

  return (
    <main className="space-y-6">
      <ResumeOnboarding userId={userId} />
    </main>
  );
}