import { useMemo, useState } from 'react'
import type { Group, GroupStatus, DashboardMetrics } from '../types/evaluation'
import { generateAccessCode, getStartTime } from '../utils/code-generator'

export function useEvaluationGroups(initialGroups: Group[]) {
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [filter, setFilter] = useState<'all' | GroupStatus>('all')
  const [activeCodeGroup, setActiveCodeGroup] = useState<string | null>(null)

  const visibleGroups = useMemo(() => {
    if (filter === 'all') {
      return groups
    }
    return groups.filter((group) => group.status === filter)
  }, [groups, filter])

  const dashboard = useMemo<DashboardMetrics>(() => {
    const presented = groups.filter((group) => group.status === 'presented')
    const pending = groups.filter((group) => group.status === 'pending')
    const totalVotes = presented.reduce((sum, group) => sum + group.votes, 0)
    const averageScore =
      presented.length > 0
        ? presented.reduce((sum, group) => sum + (group.score ?? 0), 0) /
          presented.length
        : 0

    return {
      totalGroups: groups.length,
      presentedCount: presented.length,
      pendingCount: pending.length,
      averageScore,
      totalVotes,
    }
  }, [groups])

  const handleGenerateCode = (groupId: string) => {
    const newCode = generateAccessCode()
    setGroups((currentGroups) =>
      currentGroups.map((group) => {
        if (group.id !== groupId) {
          return group
        }

        return {
          ...group,
          accessCode: newCode,
          startedAt: getStartTime(),
        }
      }),
    )
    setActiveCodeGroup(groupId)
  }

  return {
    groups,
    visibleGroups,
    filter,
    setFilter,
    dashboard,
    activeCodeGroup,
    handleGenerateCode,
  }
}
