import { CompanyAdministratorEditView } from "@/features/company-administrators/components/company-administrator-edit-view";

interface CompanyAdministratorEditPageProps {
  params: Promise<{
    companyId: string;
  }>;
}

export default async function CompanyAdministratorEditPage({
  params,
}: CompanyAdministratorEditPageProps) {
  const { companyId } = await params;

  return <CompanyAdministratorEditView companyId={companyId} />;
}
