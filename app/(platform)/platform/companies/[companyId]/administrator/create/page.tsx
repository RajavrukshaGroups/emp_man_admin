import { CompanyAdministratorCreateView } from "@/features/company-administrators/components/company-administrator-create-view";

interface CompanyAdministratorCreatePageProps {
  params: Promise<{
    companyId: string;
  }>;
}

export default async function CompanyAdministratorCreatePage({
  params,
}: CompanyAdministratorCreatePageProps) {
  const { companyId } = await params;

  return <CompanyAdministratorCreateView companyId={companyId} />;
}
