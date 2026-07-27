import { EmployeeDetailsView } from "@/features/employees/components/employee-details-view";

interface EmployeeDetailsPageProps {
  params: Promise<{
    employeeId: string;
  }>;
}

export default async function EmployeeDetailsPage({
  params,
}: EmployeeDetailsPageProps) {
  const { employeeId } = await params;

  return <EmployeeDetailsView employeeId={employeeId} />;
}
