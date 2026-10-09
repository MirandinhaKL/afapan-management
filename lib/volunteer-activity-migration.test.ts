import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { VOLUNTEER_ACTIVITIES } from "@/lib/volunteers"

const readSql = (name: string) => readFileSync(resolve(process.cwd(), "docs/specs/cadastro-voluntarios", name), "utf8")
const migration = readSql("005-volunteer-activity-catalog.sql")
const base = readSql("001-volunteers-schema.sql")

describe("preparação local da migração do catálogo (execução PostgreSQL pendente)", () => {
  it.each([["incremental", migration], ["instalação nova", base]])("CA-052/CA-055: alinha catálogo e gravações na definição %s", (_, sql) => {
    const catalog = sql.match(/check \(atividade in \(([^)]+)\)\)/)![1].match(/'([^']+)'/g)!.map((value) => value.slice(1, -1))
    expect(catalog).toEqual(VOLUNTEER_ACTIVITIES.map((item) => item.value))
    expect(sql).not.toContain("otherActivityDescription")
    expect(sql).not.toMatch(/volunteer_interests\(volunteer_id,atividade,outra_descricao\)/)
    expect(sql).toContain("grant execute on function public.submit_volunteer_registration(jsonb,text,text) to service_role")
    expect(sql).toContain("grant execute on function public.save_assisted_volunteer(uuid,timestamptz,jsonb) to authenticated")
  })

  it("CA-054: prepara transação que exclui exclusivamente interesses sem remover tabela, chaves ou RLS", () => {
    const sql = migration.replace(/--[^\n]*/g, "")
    expect(sql.trim()).toMatch(/^begin;/)
    expect(sql.trim()).toMatch(/commit;$/)
    expect([...sql.matchAll(/delete from public\.(\w+)/gi)].map((match) => match[1])).toEqual(["volunteer_interests", "volunteer_interests"])
    expect(sql).not.toMatch(/drop table|drop index|disable row level security|drop policy|drop constraint.*(?:pkey|fkey)/i)
    expect(sql).toContain("drop column if exists outra_descricao")
    expect(sql).toContain("security definer language plpgsql set search_path = ''")
  })
})
