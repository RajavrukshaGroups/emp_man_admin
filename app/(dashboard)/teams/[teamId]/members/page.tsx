import { ManageTeamMembers } from "@/features/teams/components/manage-team-members";

interface ManageTeamMembersPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function ManageTeamMembersPage({
  params,
}: ManageTeamMembersPageProps) {
  const { teamId } = await params;

  return <ManageTeamMembers teamId={teamId} />;
}