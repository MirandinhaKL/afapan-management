// Requer @electric-sql/pglite instalado em pasta isolada, passada como argumento.
// Usa somente PostgreSQL em memória, com auth.uid() simulado; não conecta ao Supabase.
const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const { join, resolve } = require("node:path")
const modulePath = process.argv[2]
if (!modulePath) throw new Error("Informe o caminho do módulo local @electric-sql/pglite.")
const { PGlite } = require(resolve(modulePath))
const active = "fc61a6d4-71e5-472a-9702-c60707d8efed"
const inactive = "6fb4490c-b131-443a-aee0-5fed85881616"

async function run() {
  const db = new PGlite()
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key);
      create table profiles(id uuid primary key references auth.users, ativo boolean not null, nome text default 'Aprovador Exemplo');
      create function auth.uid() returns uuid language sql stable as
        $$select nullif(current_setting('test.uid',true),'')::uuid$$;
      insert into auth.users values ('${active}'), ('${inactive}');
      insert into profiles(id,ativo) values ('${active}',true), ('${inactive}',false);
    `)
    const apply = name => db.exec(readFileSync(join(__dirname, name), "utf8"))
    await apply("001-conecta-foundation.sql")
    await apply("002-conecta-catalog-seed.sql")
    await apply("002-conecta-catalog-seed.sql")
    await apply("003-conecta-catalog-api.sql")
    await apply("004-conecta-submission.sql")
    await apply("005-conecta-review.sql")
    await apply("006-conecta-correction.sql")
    await apply("007-conecta-certificates.sql")
    await apply("008-conecta-optional-evidence.sql")
    await apply("009-conecta-approve-optional-evidence.sql")
    await apply("010-conecta-certificate-approver.sql")
    await apply("011-conecta-certificate-invalidation-reason.sql")
    const query = async (sql, args) => (await db.query(sql, args)).rows
    const tables = (await query("select relname,relrowsecurity from pg_class where relname like 'conecta_%' and relkind='r'"))
    assert.equal(tables.length, 14)
    assert(tables.every(table => table.relrowsecurity))
    const catalog = async internal => (await query("select public.conecta_read_catalog($1) as data", [internal]))[0].data
    const seed = await catalog(false)
    assert.equal(seed.length, 8)
    const hours = Object.fromEntries(seed.map(row => [row.name, row.tasks.reduce((sum, task) => sum + task.minutes, 0)]))
    assert.equal(hours["Compostando nas Escolas"], 720)
    assert.equal(hours["Materiais educativos e institucionais"], 960)
    assert.equal(hours["Visitas técnicas"], 0)
    assert.equal(seed.find(row => row.name === "Visitas técnicas").mode, "free")
    for (const role of ["anon", "authenticated", "service_role"]) {
      await db.exec("set role " + role)
      for (const table of tables) {
        assert.match(table.relname, /^conecta_[a-z_]+$/)
        await assert.rejects(db.query("select 1 from public." + table.relname), error => error.code === "42501")
      }
      await db.exec("reset role")
    }
    await db.exec("set role anon")
    await assert.rejects(catalog(false), error => error.code === "42501")
    await db.exec("reset role; set role authenticated;")
    await db.query("select set_config('test.uid',$1,false)", [inactive])
    const save = (id, version, project, name, minutes) => query(
      "select public.conecta_save_modality($1,$2,$3,$4,$5,$6,$7,$8) as id",
      [id, version, project, "Novo projeto fictício", name, "", "checklist", JSON.stringify([{ label: "Tarefa fictícia", minutes }])],
    )
    await assert.rejects(catalog(true), error => error.code === "42501")
    await assert.rejects(save(null, null, null, "Inativa", 60), error => error.code === "42501")
    await db.query("select set_config('test.uid',$1,false)", [active])
    await assert.rejects(save(null, null, null, "Inválida", 0), error => error.code === "22023")
    const [{ id }] = await save(null, null, null, "Modalidade fictícia", 60)
    const created = (await catalog(true)).find(row => row.id === id)
    assert.equal(created.version, 1)
    await save(id, 1, created.projectId, "Modalidade atualizada", 120)
    await assert.rejects(save(id, 1, created.projectId, "Edição obsoleta", 180), error => error.code === "40001")
    assert.equal((await catalog(true)).find(row => row.id === id).tasks[0].minutes, 120)
    await db.query("select public.conecta_set_modality_active($1,false)", [id])
    assert.equal((await catalog(false)).some(row => row.id === id), false)
    assert.equal((await catalog(true)).find(row => row.id === id).active, false)
    await db.exec("reset role")
    assert.equal((await query("select minutes from conecta_tasks where modality_version_id=$1", [created.versionId]))[0].minutes, 60)
    assert.equal((await query("select count(*)::int as total from conecta_catalog_events where modality_id=$1 and actor=$2", [id, active]))[0].total, 3)
    const modality = seed.find(row => row.name === "Compostando nas Escolas")
    const file = { id: "5d1c4610-e0fa-42a9-a1ba-fee6f604001f", path: "evidence/ficticio", mime: "image/png", bytes: 15 }
    const verified = [{ id: file.id, bytes: 15, sha256: "a".repeat(64) }]
    const input = { cpf: "52998224725", birthDate: "1999-01-01", startDate: "2020-01-01", endDate: "2020-01-02", name: "Pessoa fictícia", email: "aluno@example.test", phone: "54999990000", institution: "Exemplo", course: "Exemplo", report: "Relato fictício", modalityVersion: modality.versionId, tasks: [modality.tasks[0].id], attachments: [file.id] }
    const token = "b".repeat(64), otherToken = "c".repeat(64), payload = "d".repeat(64), verifier = active
    const submit = (hash, files, digest = payload, application = input) => query(
      "select public.conecta_submit_application($1,$2,$3,$4,$5) as id",
      [hash, verifier, digest, JSON.stringify(application), JSON.stringify(files)],
    )
    await db.exec("set role authenticated")
    await assert.rejects(submit(token, verified), error => error.code === "42501")
    await db.exec("reset role; set role service_role")
    const reserve = (hash, manifest) => query("select public.conecta_reserve_upload($1,$2,$3)", [hash, "e".repeat(64), JSON.stringify(manifest)])
    const claim = (hash, who = verifier) => query("select public.conecta_get_upload($1,$2) as data", [hash, who])
    await reserve(token, [file])
    await claim(token)
    await assert.rejects(claim(token, inactive), error => error.code === "55P03")
    await assert.rejects(submit(token, []), error => error.code === "22023")
    await assert.rejects(submit(token, verified, payload, { ...input, tasks: [modality.tasks[0].id, modality.tasks[0].id] }), error => error.code === "22023")
    const [{ id: applicationId }] = await submit(token, verified)
    assert.equal((await submit(token, verified))[0].id, applicationId)
    await assert.rejects(submit(token, verified, "f".repeat(64)), error => error.code === "22023")
    const otherFile = { ...file, id: "778d2488-d875-4bbc-964e-370ec445dcba", path: "evidence/outro-ficticio" }
    await reserve(otherToken, [otherFile])
    await claim(otherToken)
    await assert.rejects(submit(otherToken, [{ ...verified[0], id: otherFile.id }], payload, { ...input, attachments: [otherFile.id] }), error => error.code === "23505")
    await db.exec("reset role")
    assert.equal((await query("select count(*)::int as total from conecta_applications"))[0].total, 1)
    assert.equal((await query("select count(*)::int as total from conecta_attachments"))[0].total, 1)
    await db.exec("set role authenticated")
    await db.query("select set_config('test.uid',$1,false)", [inactive])
    await assert.rejects(query("select public.conecta_list_applications('','pending',0)"), error => error.code === "42501")
    await db.query("select set_config('test.uid',$1,false)", [active])
    const list = (await query("select public.conecta_list_applications($1,'pending',0) as data", ["529.982"] ))[0].data
    assert.equal(list.total, 1)
    assert.equal(list.items[0].id, applicationId)
    assert.equal("cpf" in list.items[0], false)
    assert.equal("birth_date" in list.items[0], false)
    const review = (tasks, reason = null) => query(
      "select public.conecta_review_application($1,1,'approved',$2,null,$3)",
      [applicationId, tasks, reason],
    )
    await assert.rejects(review(modality.tasks.map(task => task.id)), error => error.code === "22023")
    await review([modality.tasks[0].id])
    await assert.rejects(review([modality.tasks[0].id]), error => error.code === "40001")
    const detail = (await query("select public.conecta_get_application($1) as data", [applicationId]))[0].data
    assert.equal(detail.approved_minutes, 360)
    assert.equal(detail.status, "approved")
    assert.equal(detail.modality_minutes, 360)
    assert.deepEqual(detail.declared_tasks, [modality.tasks[0].id])
    assert.equal(detail.decisions.length, 1)
    await db.exec("reset role")
    assert.equal((await query("select actor from conecta_decisions where application_id=$1", [applicationId]))[0].actor, active)
    await db.exec("set role service_role")
    const otherInput = { ...input, startDate: "2020-02-01", endDate: "2020-02-02", attachments: [otherFile.id] }
    const [{ id: correctionId }] = await submit(otherToken, [{ ...verified[0], id: otherFile.id }], payload, otherInput)
    await db.exec("reset role; set role authenticated")
    const oldHash = "1".repeat(64), correctionHash = "2".repeat(64)
    const request = (id, hash) => query("select public.conecta_request_correction($1,1,'Complemente o relato',$2,$3)", [correctionId, id, hash])
    await db.query("select set_config('test.uid',$1,false)", [inactive])
    await assert.rejects(request(active, oldHash), error => error.code === "42501")
    await db.query("select set_config('test.uid',$1,false)", [active])
    await request(active, oldHash)
    await request(inactive, correctionHash)
    await db.exec("reset role; set role service_role")
    const getCorrection = async hash => (await query("select public.conecta_get_correction($1) as data", [hash]))[0].data
    assert.equal(await getCorrection(oldHash), null)
    const correction = await getCorrection(correctionHash)
    assert.equal(correction.reason, "Complemente o relato")
    assert.equal("cpf" in correction || "email" in correction, false)
    const uploadHash = "3".repeat(64)
    const newFile = { ...file, id: "3eb978ae-c801-4d35-a4b6-a9e2ae6fd686", path: "evidence/correcao-ficticia" }
    await reserve(uploadHash, [newFile])
    await claim(uploadHash)
    const correct = (files, digest = payload) => query(
      "select public.conecta_submit_correction($1,$2,$3,$4,$5,$6) as id",
      [correctionHash, uploadHash, verifier, digest, JSON.stringify({ report: "Relato corrigido", tasks: input.tasks }), JSON.stringify(files)],
    )
    await assert.rejects(correct([]), error => error.code === "22023")
    const newEvidence = [{ ...verified[0], id: newFile.id }]
    assert.equal((await correct(newEvidence))[0].id, correctionId)
    assert.equal((await correct(newEvidence))[0].id, correctionId)
    await assert.rejects(correct(newEvidence, "4".repeat(64)), error => error.code === "22023")
    assert.equal(await getCorrection(correctionHash), null)
    await db.exec("reset role")
    assert.deepEqual((await query("select revision,status from conecta_applications where id=$1", [correctionId]))[0], { revision: 2, status: "pending" })
    assert.deepEqual((await query("select revision from conecta_attachments where application_id=$1 order by revision", [correctionId])).map(row => row.revision), [1, 2])
    assert.deepEqual((await query("select report from conecta_application_revisions where application_id=$1 order by revision", [correctionId])).map(row => row.report), ["Relato fictício", "Relato corrigido"])
    assert.deepEqual((await query("select decision from conecta_decisions where application_id=$1", [correctionId])).map(row => row.decision), ["returned"])
    assert.equal((await query("select recipient from conecta_email_outbox where event_key=$1", ["correction:" + inactive]))[0].recipient, input.email)
    assert.equal((await query("select status from conecta_email_outbox where event_key=$1", ["correction:" + active]))[0].status, "cancelled")
    const configuration = { city: "Farroupilha, RS" }
    const reserveCertificate = async (actor, code, settings) => (await query(
      "select public.conecta_reserve_certificate($1,$2,$3,$4) as data",
      [applicationId, actor, code, JSON.stringify(settings)],
    ))[0].data
    const firstCode = "A".repeat(32), secondCode = "B".repeat(32)
    await db.exec("set role authenticated")
    await assert.rejects(reserveCertificate(active, firstCode, configuration), error => error.code === "42501")
    await db.exec("reset role; set role service_role")
    await assert.rejects(reserveCertificate(inactive, firstCode, configuration), error => error.code === "42501")
    await assert.rejects(reserveCertificate(active, firstCode, {}), error => error.code === "22023")
    const first = await reserveCertificate(active, firstCode, configuration)
    const repeat = await reserveCertificate(active, secondCode, {})
    assert.deepEqual(first, repeat)
    assert.equal(first.snapshot.minutes, 360)
    assert.equal(first.snapshot.signer, "Aprovador Exemplo")
    assert.equal(first.snapshot.title, "AFAPAN")
    assert.equal(first.snapshot.city, "Farroupilha, RS")
    assert.equal(first.snapshot.code, firstCode)
    assert.match(first.snapshot.issuedAt, /[+-]\d{2}:\d{2}$/)
    const finalize = (hash) => query("select public.conecta_finish_certificate($1,$2) as path", [first.id, hash])
    const [{ path: original }] = await finalize(payload)
    assert.equal(original, `certificates/${first.id}/original.pdf`)
    await finalize(payload)
    await assert.rejects(finalize(token), error => error.code === "40001")
    await db.exec("reset role; set role authenticated")
    const certificateStatus = async () => (await query("select public.conecta_certificate_status($1) as status", [applicationId]))[0].status
    assert.equal((await certificateStatus()).invalidationReason, null)
    const invalidate = reason => query("select public.conecta_invalidate_certificate($1,$2)", [first.id, reason])
    await assert.rejects(invalidate(""), error => error.code === "22023")
    await invalidate("Emissão de teste")
    const invalidated = await certificateStatus()
    assert.equal(invalidated.id, first.id)
    assert.equal(invalidated.invalidated, true)
    assert.equal(invalidated.invalidationReason, "Emissão de teste")
    await db.exec("reset role; set role anon")
    await assert.rejects(certificateStatus(), error => error.code === "42501")
    await db.exec("reset role; set role service_role")
    await assert.rejects(finalize(payload), error => error.code === "40001")
    const replacement = await reserveCertificate(active, secondCode, configuration)
    assert.notEqual(replacement.id, first.id)
    await db.exec("reset role")
    assert.deepEqual((await query("select replaces, code from conecta_certificates where id=$1", [replacement.id]))[0], { replaces: first.id, code: secondCode })
    assert.deepEqual((await query("select generated_key, invalidated_by from conecta_certificates where id=$1", [first.id]))[0], { generated_key: original, invalidated_by: active })
    await db.exec("set role service_role")
    const noFilesToken = "9".repeat(64)
    await reserve(noFilesToken, [])
    await claim(noFilesToken)
    const noFilesInput = { ...input, tasks: [modality.tasks[1].id], attachments: [], startDate: "2020-03-01", endDate: "2020-03-02" }
    const [{ id: noFilesId }] = await submit(noFilesToken, [], payload, noFilesInput)
    assert.equal((await submit(noFilesToken, [], payload, noFilesInput))[0].id, noFilesId)
    await db.exec("reset role")
    assert.equal((await query("select count(*)::int as n from conecta_attachments where application_id=$1", [noFilesId]))[0].n, 0)
    await db.exec("set role authenticated")
    const approveWithoutEvidence = tasks => query(
      "select public.conecta_review_application($1,1,'approved',$2,null,null)",
      [noFilesId, tasks],
    )
    await assert.rejects(approveWithoutEvidence(input.tasks), error => error.code === "22023")
    await approveWithoutEvidence(noFilesInput.tasks)
    await assert.rejects(approveWithoutEvidence(noFilesInput.tasks), error => error.code === "40001")
    await db.exec("reset role")
    assert.deepEqual((await query("select status,approved_minutes from conecta_applications where id=$1", [noFilesId]))[0], { status: "approved", approved_minutes: 120 })
    console.log("SQL local aprovado incluindo envio sem comprovante, idempotência e preservação de arquivos.")
  } finally { await db.close() }
}
run().catch(error => { console.error(error); process.exitCode = 1 })
