import { ManageDepartmentHead } from "@/features/departments/components/manage-department-head";

interface ManageDepartmentHeadPageProps {
  params: Promise<{
    departmentId: string;
  }>;
}

export default async function ManageDepartmentHeadPage({
  params,
}: ManageDepartmentHeadPageProps) {
  const { departmentId } = await params;

  return <ManageDepartmentHead departmentId={departmentId} />;
}