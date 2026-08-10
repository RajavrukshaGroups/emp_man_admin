import { EditCompanyView } from "@/features/companies/components/edit-company-view";

interface EditCompanyPageProps {
  params: Promise<{
    companyId: string;
  }>;
}

export default async function EditCompanyPage({
  params,
}: EditCompanyPageProps) {
  const { companyId } = await params;

  return <EditCompanyView companyId={companyId} />;
}
