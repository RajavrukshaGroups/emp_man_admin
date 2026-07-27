import { EditEmployeeForm } from "@/features/employees/components/edit-employee-form";

interface EditEmployeePageProps {
  params: Promise<{
    employeeId: string;
  }>;
}

export default async function EditEmployeePage({
  params,
}: EditEmployeePageProps) {
  const { employeeId } = await params;

  return <EditEmployeeForm employeeId={employeeId} />;
}
