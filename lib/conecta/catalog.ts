import { z } from "zod"

export const catalogTaskSchema = z.object({
  label: z.string().trim().min(1).max(500),
  minutes: z.number().int().positive().max(9_999_999),
})
export const modalityDraftSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(3000),
  projectId: z.string().uuid().optional(),
  projectName: z.string().trim().max(160).optional(),
  mode: z.enum(["checklist", "free"]),
  tasks: z.array(catalogTaskSchema).max(100),
}).superRefine((value, context) => {
  if (!value.projectId && !value.projectName) context.addIssue({ code: "custom", path: ["projectName"], message: "Informe o projeto." })
  if (value.mode === "checklist" ? value.tasks.length === 0 : value.tasks.length !== 0) {
    context.addIssue({ code: "custom", path: ["tasks"], message: "Confira as tarefas da modalidade." })
  }
})
export const catalogSchema = z.array(z.object({
  id: z.string().uuid(), projectId: z.string().uuid(), project: z.string(), active: z.boolean(),
  versionId: z.string().uuid(), version: z.number().int().positive(),
  name: z.string(), description: z.string(), mode: z.enum(["checklist", "free"]),
  tasks: z.array(catalogTaskSchema.extend({ id: z.string().uuid() })),
}))
export type CatalogModality = z.infer<typeof catalogSchema>[number]

export function modalityRpcPayload(draft: unknown, current?: CatalogModality) {
  const input = modalityDraftSchema.parse(draft)
  return {
    p_id: current?.id ?? null,
    p_expected_version: current?.version ?? null,
    p_project: current?.projectId ?? input.projectId ?? null,
    p_project_name: input.projectName || null,
    p_name: input.name,
    p_description: input.description,
    p_mode: input.mode,
    p_tasks: input.tasks,
  }
}
