import { EditTeamForm } from "@/features/teams/components/edit-team-form";

interface EditTeamPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function EditTeamPage({
  params,
}: EditTeamPageProps) {
  const { teamId } = await params;

  return <EditTeamForm teamId={teamId} />;
}