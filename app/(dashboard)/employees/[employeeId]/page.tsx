interface EmployeeDetailsPageProps {
  params: Promise<{
    employeeId: string;
  }>;
}

export default async function EmployeeDetailsPage({
  params,
}: EmployeeDetailsPageProps) {
  const { employeeId } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Employee details
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          The employee onboarding process was completed successfully.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-sm font-semibold text-emerald-800">
          Employee profile created successfully
        </p>

        <p className="mt-2 break-all text-sm text-emerald-700">
          Employee ID: {employeeId}
        </p>
      </div>
    </div>
  );
}
