-- Carga inicial local. Aplicar somente após autorização e migração 001.
-- Não altera modalidades previamente cadastradas.
begin;
set local lock_timeout = '5s';
do $$
declare p uuid; m uuid; v uuid;
begin
  insert into public.conecta_projects(slug,name) values('compostando-juntos','Compostando Juntos') on conflict (slug) do nothing;
  select id into p from public.conecta_projects where slug='compostando-juntos';
  m := null;
  insert into public.conecta_modalities(project_id,slug) values(p,'compostando-juntos') on conflict (slug) do nothing returning id into m;
  if m is not null then
    insert into public.conecta_modality_versions(modality_id,version,name,mode) values(m,1,'Compostando Juntos','checklist') returning id into v;
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,1,'Criação e configuração do formulário de inscrição',60);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,2,'Organização dos inscritos e inclusão dos contatos no grupo da turma',120);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,3,'Preparação e envio dos arquivos de adesivos e calendários para impressão',120);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,4,'Organização e revisão dos slides do treinamento',120);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,5,'Participação no treinamento, organização/coleta de assinaturas, fotos/vídeos e entrega das caixas de compostagem',180);
  end if;
  insert into public.conecta_projects(slug,name) values('compostando-nas-escolas','Compostando nas Escolas') on conflict (slug) do nothing;
  select id into p from public.conecta_projects where slug='compostando-nas-escolas';
  m := null;
  insert into public.conecta_modalities(project_id,slug) values(p,'compostando-nas-escolas') on conflict (slug) do nothing returning id into m;
  if m is not null then
    insert into public.conecta_modality_versions(modality_id,version,name,mode) values(m,1,'Compostando nas Escolas','checklist') returning id into v;
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,1,'Pesquisa/planejamento de conteúdos didáticos e elaboração/adaptação de materiais à faixa etária',360);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,2,'Pesquisa de fornecedores e orçamentos para impressão ou compra',120);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,3,'Separação e organização dos materiais',60);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,4,'Entrega dos materiais à escola',120);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,5,'Registro da entrega e organização dos arquivos do projeto',60);
  end if;
  insert into public.conecta_projects(slug,name) values('marketing','Marketing e comunicação ambiental') on conflict (slug) do nothing;
  select id into p from public.conecta_projects where slug='marketing';
  m := null;
  insert into public.conecta_modalities(project_id,slug) values(p,'marketing-redes') on conflict (slug) do nothing returning id into m;
  if m is not null then
    insert into public.conecta_modality_versions(modality_id,version,name,mode) values(m,1,'Conteúdo para redes sociais','checklist') returning id into v;
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,1,'Roteiro ou planejamento do conteúdo',60);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,2,'Criação de card ou carrossel',120);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,3,'Criação de vídeo',180);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,4,'Legenda/chamada para ação, revisão, ajustes e entrega dos arquivos',60);
  end if;
  insert into public.conecta_projects(slug,name) values('marketing','Marketing e comunicação ambiental') on conflict (slug) do nothing;
  select id into p from public.conecta_projects where slug='marketing';
  m := null;
  insert into public.conecta_modalities(project_id,slug) values(p,'marketing-materiais') on conflict (slug) do nothing returning id into m;
  if m is not null then
    insert into public.conecta_modality_versions(modality_id,version,name,mode) values(m,1,'Materiais educativos e institucionais','checklist') returning id into v;
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,1,'Pesquisa e levantamento de informações',180);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,2,'Planejamento e estruturação do material',120);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,3,'Redação e elaboração do conteúdo',300);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,4,'Diagramação e desenvolvimento visual',300);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,5,'Ajustes finais e preparação dos arquivos',60);
  end if;
  insert into public.conecta_projects(slug,name) values('eco-drive','Eco Drive') on conflict (slug) do nothing;
  select id into p from public.conecta_projects where slug='eco-drive';
  m := null;
  insert into public.conecta_modalities(project_id,slug) values(p,'eco-drive') on conflict (slug) do nothing returning id into m;
  if m is not null then
    insert into public.conecta_modality_versions(modality_id,version,name,mode) values(m,1,'Apoio às coletas de resíduos especiais','checklist') returning id into v;
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,1,'Apoio à coleta, separação, orientação, pesagem e registro fotográfico',300);
  end if;
  insert into public.conecta_projects(slug,name) values('caminhos-residuos','Caminhos dos Resíduos') on conflict (slug) do nothing;
  select id into p from public.conecta_projects where slug='caminhos-residuos';
  m := null;
  insert into public.conecta_modalities(project_id,slug) values(p,'caminhos-residuos') on conflict (slug) do nothing returning id into m;
  if m is not null then
    insert into public.conecta_modality_versions(modality_id,version,name,mode) values(m,1,'Acompanhamento de visitas educativas','checklist') returning id into v;
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,1,'Acompanhar turma e registrar fotos e vídeos',300);
  end if;
  insert into public.conecta_projects(slug,name) values('educacao-ambiental','Educação ambiental') on conflict (slug) do nothing;
  select id into p from public.conecta_projects where slug='educacao-ambiental';
  m := null;
  insert into public.conecta_modalities(project_id,slug) values(p,'educacao-ambiental') on conflict (slug) do nothing returning id into m;
  if m is not null then
    insert into public.conecta_modality_versions(modality_id,version,name,mode) values(m,1,'Oficinas, palestras, eventos e mutirões de limpeza','checklist') returning id into v;
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,1,'Planejamento da oficina, palestra ou evento',60);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,2,'Elaboração e organização dos slides',180);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,3,'Pesquisa e contato com parceiros ou fornecedores',120);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,4,'Preparação dos materiais e organização logística',120);
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(v,5,'Apoio na realização da atividade',240);
  end if;
  insert into public.conecta_projects(slug,name) values('visitas-tecnicas','Visitas técnicas') on conflict (slug) do nothing;
  select id into p from public.conecta_projects where slug='visitas-tecnicas';
  m := null;
  insert into public.conecta_modalities(project_id,slug) values(p,'visitas-tecnicas') on conflict (slug) do nothing returning id into m;
  if m is not null then
    insert into public.conecta_modality_versions(modality_id,version,name,mode) values(m,1,'Visitas técnicas','free') returning id into v;
  end if;
end $$;
commit;
