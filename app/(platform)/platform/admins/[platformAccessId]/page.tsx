import { PlatformAdminDetails } from "@/features/platform-admins/components/platform-admin-details";

interface PlatformAdminDetailsPageProps {
  params: Promise<{
    platformAccessId: string;
  }>;
}

export default async function PlatformAdminDetailsPage({
  params,
}: PlatformAdminDetailsPageProps) {
  const { platformAccessId } = await params;

  return (
    <PlatformAdminDetails
      platformAccessId={platformAccessId}
    />
  );
}