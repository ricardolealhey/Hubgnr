import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { isSupabaseConfigured, supabase } from './supabase';
import './styles.css';

function Brand() {
  return <div className="brand"><div className="brand-mark">NR</div><div><strong>HUB GNR</strong><span>GRUPO NOVA ROTA</span></div></div>;
}

function AuthScreen({ initialMode = 'login', onPasswordUpdated }) {
  const [mode, setMode] = useState(initialMode);
  useEffect(() => setMode(initialMode), [initialMode]);
  const [email, setEmail] = useState('ricardolealrssc@gmail.com');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault(); setMessage(''); setBusy(true);
    try {
      if (mode === 'recover') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error;
        setMessage('Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.');
      } else if (mode === 'update') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage('Senha atualizada. Você já pode continuar.'); setMode('login'); setPassword(''); onPasswordUpdated?.();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) { setMessage(error.message || 'Não foi possível concluir a solicitação.'); }
    finally { setBusy(false); }
  }

  return <main className="auth-layout"><section className="auth-panel"><Brand />
    <div className="auth-copy"><p className="eyebrow">CENTRAL DE COMANDO</p><h1>{mode === 'recover' ? 'Recuperar acesso.' : mode === 'update' ? 'Defina sua nova senha.' : 'Tudo conectado. Uma só rota.'}</h1><p>{mode === 'recover' ? 'Informe seu e-mail para receber o link de redefinição.' : mode === 'update' ? 'Escolha uma senha segura para sua conta.' : 'Acesse o ambiente de gestão do Grupo Nova Rota.'}</p></div>
    <form onSubmit={submit} className="auth-form">
      {mode !== 'update' && <label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required /></label>}
      {mode !== 'recover' && <label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode === 'update' ? 'new-password' : 'current-password'} minLength="8" required /></label>}
      <button className="primary" disabled={busy}>{busy ? 'Aguarde...' : mode === 'recover' ? 'Enviar link' : mode === 'update' ? 'Atualizar senha' : 'Entrar no HUB'}</button>
    </form>
    {message && <p className="message" role="status">{message}</p>}
    {mode === 'login' && <button className="text-button" onClick={()=>{setMode('recover');setMessage('')}}>Esqueci minha senha</button>}
    {(mode === 'recover' || mode === 'update') && <button className="text-button" onClick={()=>{setMode('login');setMessage('')}}>Voltar para o login</button>}
    <p className="footnote">Acesso restrito a usuários autorizados.</p>
  </section><aside className="auth-art"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="art-center"><span>GNR</span><small>ESTRATÉGIA • EXECUÇÃO • RESULTADO</small></div></aside></main>;
}

const modules = [
  ['01','Visão Geral','Painel central e indicadores','overview'],
  ['02','Empresas','Unidades e operações do grupo','companies'],
  ['03','Clientes','Contatos e relacionamento','clients'],
  ['04','CRM Comercial','Oportunidades e funil de vendas','crm'],
  ['05','Projetos','Entregas, etapas e responsáveis','projects'],
  ['06','Tarefas','Rotina e prioridades da equipe','tasks'],
  ['07','Calendário','Agenda e compromissos','calendar'],
  ['08','Financeiro','Receitas, despesas e fluxo','finance'],
  ['09','Presença Digital','Google, sites e redes sociais','presence'],
  ['10','GNR Connect','Monitoramento e alertas','connect'],
  ['11','Chamados','Solicitações e suporte','tickets'],
  ['12','Portal do Cliente','Área de acompanhamento','portal'],
  ['13','GNR Performance','Tráfego pago e resultados','performance'],
  ['14','Mentoria','Planos e acompanhamento','mentoring'],
  ['15','Relatórios','Indicadores e análises','reports'],
];

const phases = [
  { name: 'Fundação e identidade', status: 'Concluída', detail: 'Estrutura visual, navegação e aplicação responsiva', done: true },
  { name: 'Autenticação e acesso', status: 'Validada', detail: 'Login, sessão e perfil Master', done: true },
  { name: 'Master Dashboard', status: 'Em validação', detail: 'Visão central, indicadores e atalhos', done: false },
  { name: 'Cadastros-base', status: 'Próxima', detail: 'Empresas, clientes e equipe', done: false },
];

function StatCard({ label, value, detail, icon, muted = false }) {
  return <article className={muted ? 'stat-card stat-muted' : 'stat-card'}><div className="stat-top"><span>{label}</span><i>{icon}</i></div><strong>{value}</strong><small>{detail}</small></article>;
}

function Dashboard({ profile, onLogout }) {
  const [active, setActive] = useState('Visão Geral');
  const [counts, setCounts] = useState({ users: null, clients: null });
  const [countsState, setCountsState] = useState('loading');
  const [lastUpdated, setLastUpdated] = useState(null);
  const name = profile?.full_name || profile?.email?.split('@')[0] || 'Administrador';
  const firstName = name.split(' ')[0];
  const today = useMemo(() => new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()), []);\n  const greeting = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  useEffect(() => {
    let alive = true;
    async function loadCounts() {
      setCountsState('loading');
      const [usersResult, clientsResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('role', 'client')
      ]);
      if (!alive) return;
      if (usersResult.error || clientsResult.error) setCountsState('error');
      else {
        setCounts({ users: usersResult.count ?? 0, clients: clientsResult.count ?? 0 });
        setCountsState('ready');
        setLastUpdated(new Date());
      }
    }
    loadCounts();
    return () => { alive = false; };
  }, []);

  const selected = modules.find(m => m[1] === active);
  const isOverview = active === 'Visão Geral';

  return <div className="app-shell">
    <aside className="sidebar"><Brand /><div className="side-label">CENTRAL DE GESTÃO</div><nav>{modules.map(([n,title,,key])=><button key={n} className={active===title?'nav-item selected':'nav-item'} onClick={()=>setActive(title)}><span>{n}</span><b>{title}</b></button>)}</nav><div className="side-bottom"><span className="status-dot"></span> Supabase conectado</div></aside>
    <main className="main-area">
      <header className="topbar"><div><span className="eyebrow">GRUPO NOVA ROTA / MASTER</span><h2>{active}</h2></div><div className="user-area"><div className="avatar">{name.slice(0,1).toUpperCase()}</div><div><b>{name}</b><small>{profile?.role || 'usuário'}</small></div><button className="logout" onClick={onLogout}>Sair</button></div></header>
      {isOverview ? <>
        <section className="dashboard-intro"><div><p className="eyebrow">PAINEL MASTER</p><h1>{greeting}, {firstName}.</h1><p>Uma visão central para acompanhar e conduzir as operações do Grupo Nova Rota.</p><span className="today-label">{today}</span></div><div className="intro-emblem"><span>NR</span><small>BY GNR</small></div></section>
        <section className="section-heading"><div><span className="eyebrow">INDICADORES DO GRUPO</span><h3>Visão operacional</h3></div><span className="live-label"><i></i>{countsState === 'ready' ? 'Dados atualizados' : countsState === 'error' ? 'Falha ao consultar' : 'Consultando dados'}</span></section>
        <section className="stats">
          <StatCard label="EMPRESAS / UNIDADES" value="—" detail="Cadastro previsto na próxima etapa" icon="01" muted />
          <StatCard label="CLIENTES ATIVOS" value={countsState === 'ready' ? counts.clients : '—'} detail={countsState === 'ready' ? 'Perfis ativos com função cliente' : countsState === 'error' ? 'Não foi possível consultar' : 'Consultando base de usuários'} icon="02" />
          <StatCard label="PROJETOS EM ANDAMENTO" value="—" detail="Módulo de projetos ainda não implantado" icon="03" muted />
          <StatCard label="USUÁRIOS ATIVOS" value={countsState === 'ready' ? counts.users : '—'} detail={countsState === 'ready' ? 'Perfis ativos cadastrados' : countsState === 'error' ? 'Não foi possível consultar' : 'Consultando base de usuários'} icon="04" />
        </section>
        <section className="dashboard-columns">
          <article className="panel-card module-panel"><div className="panel-title"><div><span className="eyebrow">NAVEGAÇÃO RÁPIDA</span><h3>Acesse os módulos</h3></div><span className="count-tag">15 áreas planejadas</span></div><div className="module-grid">{modules.slice(1).map(([n,title,desc])=><button key={n} className="module-tile" onClick={()=>setActive(title)}><span>{n}</span><div><b>{title}</b><small>{desc}</small></div><i>↗</i></button>)}</div></article>
          <div className="right-stack">
            <article className="panel-card"><div className="panel-title"><div><span className="eyebrow">IMPLANTAÇÃO</span><h3>Progresso da fundação</h3></div><span className="progress-number">2/4</span></div><div className="progress-track"><span style={{width:'50%'}}></span></div><div className="phase-list">{phases.map((phase,i)=><div className="phase-row" key={phase.name}><span className={phase.done?'phase-check':'phase-number'}>{phase.done?'✓':String(i+1).padStart(2,'0')}</span><div><b>{phase.name}</b><small>{phase.detail}</small></div><em className={phase.done?'phase-done':i===2?'phase-current':'phase-pending'}>{phase.status}</em></div>)}</div></article>
            <article className="panel-card ecosystem-card"><span className="eyebrow">ECOSSISTEMA GNR</span><h3>Integrações previstas</h3><div className="ecosystem-item"><i>CRM</i><div><b>GNR CRM</b><small>Integração depende de auditoria técnica</small></div><span>PENDENTE</span></div><div className="ecosystem-item"><i>VI</i><div><b>GNR Visitor Intelligence</b><small>Integração depende de auditoria técnica</small></div><span>PENDENTE</span></div><p className="disclaimer">Nenhuma integração externa foi ativada nesta fase.</p></article>
          </div>
        </section>
        <footer className="dashboard-footer"><span>HUB GNR · Central de gestão</span><span>{lastUpdated ? 'Consulta realizada às ' + lastUpdated.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : 'Indicadores em atualização'}</span></footer>
      </> : <section className="module-placeholder"><span className="eyebrow">MÓDULO PREVISTO NA ARQUITETURA</span><div className="placeholder-icon">{selected?.[0] || 'GNR'}</div><h1>{active}</h1><p>{selected?.[2] || 'Área de gestão do Grupo Nova Rota.'}</p><div className="planned-note"><b>Etapa ainda não implantada</b><span>Este módulo será desenvolvido na fase correspondente. Nenhum dado operacional será exibido até que a estrutura esteja pronta.</span></div><button className="secondary" onClick={()=>setActive('Visão Geral')}>Voltar ao painel</button></section>}
    </main>
  </div>;
}

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    let alive = true;
    supabase.auth.getSession().then(({data}) => { if (alive) setSession(data.session); });
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (alive) { if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true); setSession(nextSession); }
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadProfile() {
      if (!session?.user) { setProfile(null); setError(''); setLoading(false); return; }
      setLoading(true);
      const { data, error: profileError } = await supabase.from('profiles').select('user_id,email,full_name,role,status').eq('user_id', session.user.id).maybeSingle();
      if (!alive) return;
      if (profileError) setError(profileError.message);
      else if (!data || data.status !== 'active' || !['master','admin'].includes(data.role)) {
        setError('Sua conta não possui permissão para acessar o painel administrativo.');
        await supabase.auth.signOut();
      } else { setProfile(data); setError(''); }
      setLoading(false);
    }
    loadProfile();
    return () => { alive = false; };
  }, [session]);

  if (!isSupabaseConfigured) return <div className="system-message"><Brand/><h1>Configuração necessária</h1><p>Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY nas variáveis de ambiente.</p></div>;
  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Conectando ao HUB GNR...</p></div>;
  if (session && profile && !recoveryMode) return <Dashboard profile={profile} onLogout={()=>supabase.auth.signOut()} />;
  return <><AuthScreen initialMode={recoveryMode ? 'update' : 'login'} onPasswordUpdated={()=>setRecoveryMode(false)} />{error && <div className="toast" role="alert">{error}</div>}</>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
