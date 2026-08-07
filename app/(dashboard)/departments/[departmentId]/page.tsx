import { DepartmentDetailsView } from "@/features/departments/components/department-details-view";

interface DepartmentDetailsPageProps {
  params: Promise<{
    departmentId: string;
  }>;
}

export default async function DepartmentDetailsPage({
  params,
}: DepartmentDetailsPageProps) {
  const { departmentId } = await params;

  return <DepartmentDetailsView departmentId={departmentId} />;
}