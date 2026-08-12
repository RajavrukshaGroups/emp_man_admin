import { EditPlatformAdminForm } from "@/features/platform-admins/components/edit-platform-admin-form";

interface EditPlatformAdminPageProps {
  params: Promise<{
    platformAccessId: string;
  }>;
}

export default async function EditPlatformAdminPage({
  params,
}: EditPlatformAdminPageProps) {
  const { platformAccessId } = await params;

  return <EditPlatformAdminForm platformAccessId={platformAccessId} />;
}
