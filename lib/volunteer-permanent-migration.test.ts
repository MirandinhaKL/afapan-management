import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const sql = readFileSync(resolve(process.cwd(), "docs/specs/cadastro-voluntarios-permanente/006-permanent-volunteer-registration.sql"), "utf8").replace(/--[^\n]*/g, "")
const body = (name: string) => sql.split(`create or replace function public.${name}`)[1].split("$$;")[0]

describe("revisão estática da migração permanente (PostgreSQL remoto pendente)", () => {
  it("CA-007/CA-012: contém quatro funções completas, sem corpo duplicado ou validações truncadas", () => {
    expect(sql.match(/create or replace function public\./g)).toHaveLength(4)
    expect(sql.match(/\$\$/g)).toHaveLength(12) // Quatro funções e dois blocos DO.
    const registration = body("submit_permanent_volunteer_registration")
    expect(registration.match(/insert into public\.volunteers\(/g)).toHaveLength(1)
    expect(registration).toContain("if v_phone !~ '^55[0-9]{10,11}$' then")
    expect(registration).toContain("if v_guardian_phone !~ '^55[0-9]{10,11}$' then")
    expect(registration).toContain("GUARDIAN_AUTHORIZATION_REQUIRED")
    expect(sql).not.toContain("v_settings.id,btrim")
    expect(sql).toMatch(/return v_id;\s*end;\s*\$\$;\s*create or replace function public.save_assisted_volunteer/)
  })
  it("CA-002/CA-005: cadastro público não consulta campanha e força situação, vínculo e consentimentos", () => {
    const registration = body("submit_permanent_volunteer_registration")
    expect(registration).not.toContain("volunteer_campaigns")
    expect(registration).not.toContain("v_campaign")
    expect(registration).toContain("null,btrim(p_payload->>'firstName')")
    expect(registration).toContain("'aguardando_validacao',v_origin")
    expect(registration).toContain("FORM_VERSION_OUTDATED")
    expect(registration).toContain("CONSENT_REQUIRED")
    expect(registration.indexOf("FORM_VERSION_OUTDATED")).toBeLessThan(registration.indexOf("insert into public.volunteers"))
    expect(registration).toContain("v_settings.privacy_version,v_settings.privacy_text")
    expect(registration).toContain("v_settings.participation_version,v_settings.participation_text")
    expect(registration).toContain("regexp_replace(coalesce(p_payload->>'phone'")
    expect(registration).not.toContain("p_payload->>'normalizedPhone'")
  })

  it("CA-005/CA-009: criação assistida usa novos textos e edição preserva consentimentos e concorrência", () => {
    const assisted = body("save_assisted_volunteer")
    expect(assisted).toContain("auth.uid() is null")
    expect(assisted).toContain("v_current is distinct from p_expected_updated_at")
    expect(assisted).toContain("if v_is_new then\n    insert into public.volunteer_consents")
    expect(assisted).toContain("v_settings.privacy_version,v_settings.privacy_text")
    expect(assisted).not.toContain("update public.volunteer_consents")
    expect(assisted).not.toContain("delete from public.volunteer_consents")
    expect(assisted).not.toMatch(/campaign_id\s*=/)
  })

  it("CA-006: chamadas de expiração antigas não alteram nenhum dado", () => {
    const expiration = body("process_expired_volunteer_campaigns")
    expect(expiration).toContain("return 0;")
    expect(expiration).not.toMatch(/\b(update|delete|insert)\b/i)
    expect(sql).toContain("if to_regclass('cron.job') is not null")
    expect(sql).toContain("cron.unschedule")
    expect(sql).toContain("'process-expired-volunteer-campaigns'")
    expect(sql).toContain("'select public.purge_old_volunteer_submission_attempts();'")
    expect(sql).not.toContain("create extension")
  })

  it("CA-007/CA-008: migração preserva dados e limpeza afeta somente tentativas antigas", () => {
    expect(sql.trim()).toMatch(/^begin;/)
    expect(sql.trim()).toMatch(/commit;$/)
    expect(sql).not.toMatch(/drop table|drop column|truncate|disable row level security|drop policy|alter table public.volunteer_interests/i)
    expect(sql).not.toMatch(/delete from public\.(volunteers|volunteer_campaigns|volunteer_consents|volunteer_status_history|volunteer_audit_log)\b/i)
    expect(sql).not.toMatch(/update public\.volunteer_campaigns\b/i)
    expect(sql).toContain("delete from public.volunteer_interests where volunteer_id=v_id")
    const purge = body("purge_old_volunteer_submission_attempts")
    expect(purge).toContain("delete from public.volunteer_public_submission_attempts")
    expect(purge).toContain("where criado_em < now() - interval '24 hours'")
    expect(sql).toContain("on conflict (id) do nothing")
  })

  it("CA-007/CA-012: limita grants e protege a configuração sem acesso anônimo direto", () => {
    expect(sql).toContain("alter table public.volunteer_registration_settings enable row level security")
    expect(sql).toContain("revoke all on table public.volunteer_registration_settings from public,anon,authenticated")
    expect(sql).toContain("grant select on table public.volunteer_registration_settings to service_role")
    expect(sql).toContain("revoke all on function public.submit_permanent_volunteer_registration(jsonb,text,text) from public,anon,authenticated")
    expect(sql).toContain("grant execute on function public.submit_permanent_volunteer_registration(jsonb,text,text) to service_role")
    expect(sql).toContain("grant execute on function public.save_assisted_volunteer(uuid,timestamptz,jsonb) to authenticated")
    expect(sql).toContain("revoke all on function %s from public,anon,authenticated,service_role")
    expect(sql).toContain("security definer language plpgsql set search_path = ''")
    expect(sql).not.toContain("grant execute on function public.submit_permanent_volunteer_registration(jsonb,text,text) to anon")
  })
})
