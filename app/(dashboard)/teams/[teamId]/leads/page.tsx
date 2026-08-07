import { ManageTeamLeads } from "@/features/teams/components/manage-team-leads";

interface ManageTeamLeadsPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function ManageTeamLeadsPage({
  params,
}: ManageTeamLeadsPageProps) {
  const { teamId } = await params;

  return <ManageTeamLeads teamId={teamId} />;
}
