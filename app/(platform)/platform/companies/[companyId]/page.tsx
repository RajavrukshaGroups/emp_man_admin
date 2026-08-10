import { CompanyDetailsView } from "@/features/companies/components/company-details-view";

interface CompanyDetailsPageProps {
  params: Promise<{
    companyId: string;
  }>;
}

export default async function CompanyDetailsPage({
  params,
}: CompanyDetailsPageProps) {
  const { companyId } = await params;

  return <CompanyDetailsView companyId={companyId} />;
}