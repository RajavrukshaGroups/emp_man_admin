import { TeamDetailsView } from "@/features/teams/components/team-details-view";

interface TeamDetailsPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function TeamDetailsPage({
  params,
}: TeamDetailsPageProps) {
  const { teamId } = await params;

  return <TeamDetailsView teamId={teamId} />;
}
