import { EditUserForm } from "@/features/users/components/edit-user-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return <EditUserForm userId={userId} />;
}
