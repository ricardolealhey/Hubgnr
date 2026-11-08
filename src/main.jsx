import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { isSupabaseConfigured, supabase } from './supabase';
import './styles.css';

function Brand() {
  return <div className="brand"><div className="brand-mark">NR</div><div><strong>HUB GNR</strong><span>GRUPO NOVA ROTA</span></div></div>;
}

function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('ricardolealrssc@gmail.com');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    setBusy(true);
    try {
      if (mode === 'recover') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage('Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.');
      } else if (mode === 'update') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage('Senha atualizada. Você já pode continuar.');
        setMode('login');
        setPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(error.message || 'Não foi possível concluir a solicitação.');
    } finally {
      setBusy(false);
    }
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
  ['01','Visão Geral','Painel central e indicadores'],
  ['02','Empresas','Unidades e operações do grupo'],
  ['03','Clientes','Contatos e relacionamento'],
  ['04','CRM Comercial','Oportunidades e funil de vendas'],
  ['05','Projetos','Entregas, etapas e responsáveis'],
  ['06','Tarefas','Rotina e prioridades da equipe'],
  ['07','Calendário','Agenda e compromissos'],
  ['08','Financeiro','Receitas, despesas e fluxo'],
  ['09','Presença Digital','Google, sites e redes sociais'],
  ['10','GNR Connect','Monitoramento e alertas'],
  ['11','Chamados','Solicitações e suporte'],
  ['12','Portal do Cliente','Área de acompanhamento'],
  ['13','GNR Performance','Tráfego pago e resultados'],
  ['14','Mentoria','Planos e acompanhamento'],
  ['15','Relatórios','Indicadores e análises'],
];

function Dashboard({ profile, onLogout }) {
  const [active, setActive] = useState('Visão Geral');
  const name = profile?.full_name || profile?.email?.split('@')[0] || 'Administrador';
  return <div className="app-shell"><aside className="sidebar"><Brand /><div className="side-label">GESTÃO</div><nav>{modules.map(([n,title,desc])=><button key={n} className={active===title?'nav-item selected':'nav-item'} onClick={()=>setActive(title)}><span>{n}</span><b>{title}</b></button>)}</nav><div className="side-bottom"><span className="status-dot"></span> Ambiente conectado</div></aside>
    <main className="main-area"><header className="topbar"><div><span className="eyebrow">GRUPO NOVA ROTA / MASTER</span><h2>{active}</h2></div><div className="user-area"><div className="avatar">{name.slice(0,1).toUpperCase()}</div><div><b>{name}</b><small>{profile?.role || 'usuário'}</small></div><button className="logout" onClick={onLogout}>Sair</button></div></header>
      {active === 'Visão Geral' ? <><section className="welcome"><div><p className="eyebrow">PAINEL MASTER</p><h1>Uma visão. Todas as operações.</h1><p>Fundação do HUB GNR conectada à autenticação oficial.</p></div><div className="welcome-mark">NR</div></section><section className="stats"><article><span>UNIDADES DO GRUPO</span><strong>—</strong><small>Aguardando cadastro</small></article><article><span>CLIENTES ATIVOS</span><strong>—</strong><small>Aguardando integração</small></article><article><span>PROJETOS EM ANDAMENTO</span><strong>—</strong><small>Aguardando cadastro</small></article><article><span>USUÁRIO CONECTADO</span><strong>01</strong><small>Perfil autenticado</small></article></section><section className="content-grid"><article className="content-card"><div className="card-heading"><div><span className="eyebrow">ESTRUTURA</span><h3>Módulos do HUB</h3></div><span className="pill">15 módulos previstos</span></div><div className="module-grid">{modules.slice(1).map(([n,title,desc])=><button key={n} className="module-tile" onClick={()=>setActive(title)}><span>{n}</span><b>{title}</b><small>{desc}</small></button>)}</div></article><article className="content-card integrations"><span className="eyebrow">PRÓXIMAS CONEXÕES</span><h3>Ecossistema GNR</h3><div className="integration"><i>CRM</i><div><b>GNR CRM</b><small>Integração pendente de auditoria</small></div><span className="pending">PENDENTE</span></div><div className="integration"><i>VI</i><div><b>GNR Visitor Intelligence</b><small>Integração pendente de auditoria</small></div><span className="pending">PENDENTE</span></div><p className="note">Os indicadores estão vazios intencionalmente. Nenhum dado operacional foi inventado.</p></article></section></> : <section className="empty-state"><span className="eyebrow">MÓDULO PLANEJADO</span><h1>{active}</h1><p>Esta área está prevista na arquitetura e será implementada na fase correspondente.</p><button className="secondary" onClick={()=>setActive('Visão Geral')}>Voltar ao painel</button></section>}
    </main></div>;
}

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    let alive = true;
    supabase.auth.getSession().then(({data}) => { if (alive) setSession(data.session); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (alive) setSession(nextSession);
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
  if (session && profile) return <Dashboard profile={profile} onLogout={()=>supabase.auth.signOut()} />;
  return <><AuthScreen />{error && <div className="toast" role="alert">{error}</div>}</>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);