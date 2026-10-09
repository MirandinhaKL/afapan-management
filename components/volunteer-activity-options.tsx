"use client"

import { VOLUNTEER_ACTIVITIES, VOLUNTEER_ACTIVITY_GROUPS, VOLUNTEER_UNDECIDED_ACTIVITY, type VolunteerActivity } from "@/lib/volunteers"

export function VolunteerActivityOptions({ selected, onChange }: { selected: VolunteerActivity[]; onChange: (activities: VolunteerActivity[]) => void }) {
  const option = (item: { value: VolunteerActivity; label: string }) => (
    <label key={item.value} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm hover:bg-muted/50">
      <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={selected.includes(item.value)} onChange={(event) => onChange(event.target.checked ? [...selected, item.value] : selected.filter((value) => value !== item.value))} />
      <span>{item.label}</span>
    </label>
  )
  return <fieldset className="space-y-4">
    <legend className="mb-3 font-bold">Atividades de interesse *</legend>
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm">
      <input type="checkbox" className="h-4 w-4 accent-primary" checked={VOLUNTEER_ACTIVITIES.every((item) => selected.includes(item.value))} onChange={(event) => onChange(event.target.checked ? VOLUNTEER_ACTIVITIES.map((item) => item.value) : [])} />
      <span>Marcar todas as atividades</span>
    </label>
    <div id="activities" tabIndex={-1} className="space-y-4">
      {VOLUNTEER_ACTIVITY_GROUPS.map((group) => <fieldset key={group.title} className="space-y-2 rounded-lg border p-3">
        <legend className="px-1 font-semibold"><span aria-hidden="true">{group.icon}</span> {group.title}</legend>
        <div className="grid gap-2 sm:grid-cols-2">{group.activities.map(option)}</div>
      </fieldset>)}
      {option(VOLUNTEER_UNDECIDED_ACTIVITY)}
    </div>
  </fieldset>
}
