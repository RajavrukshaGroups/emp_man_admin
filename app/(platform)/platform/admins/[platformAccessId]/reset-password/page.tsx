import { ResetPlatformAdminPassword } from "@/features/platform-admins/components/reset-platform-admin-password";

interface ResetPasswordPageProps {
  params: Promise<{
    platformAccessId: string;
  }>;
}

export default async function ResetPasswordPage({
  params,
}: ResetPasswordPageProps) {
  const { platformAccessId } = await params;

  return <ResetPlatformAdminPassword platformAccessId={platformAccessId} />;
}
