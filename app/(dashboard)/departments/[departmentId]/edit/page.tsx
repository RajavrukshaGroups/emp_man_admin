import { EditDepartmentForm } from "@/features/departments/components/edit-department-form";

interface EditDepartmentPageProps {
  params: Promise<{
    departmentId: string;
  }>;
}

export default async function EditDepartmentPage({
  params,
}: EditDepartmentPageProps) {
  const { departmentId } = await params;

  return <EditDepartmentForm departmentId={departmentId} />;
}
