export type GroupStatus = 'presented' | 'pending'

export type ParticipantRating = {
  id: string
  name: string
  score: number
  raterCount: number
  raters: string[]
}

export type Group = {
  id: string
  name: string
  presenter: string
  status: GroupStatus
  score: number | null
  votes: number
  startedAt: string | null
  accessCode: string | null
  participants?: ParticipantRating[]
}

export type DashboardMetrics = {
  totalGroups: number
  presentedCount: number
  pendingCount: number
  averageScore: number
  totalVotes: number
}
