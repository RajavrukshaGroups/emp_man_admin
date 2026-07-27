import { EditEmploymentForm } from "@/features/employees/components/edit-employment-form";

interface EditEmploymentPageProps {
  params: Promise<{
    employeeId: string;
  }>;
}

export default async function EditEmploymentPage({
  params,
}: EditEmploymentPageProps) {
  const { employeeId } = await params;

  return <EditEmploymentForm employeeId={employeeId} />;
}
