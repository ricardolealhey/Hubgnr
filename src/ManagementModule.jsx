import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

const config = {
  Empresas: {
    table: 'companies', title: 'Empresas e unidades', singular: 'empresa',
    fields: [
      ['name','Nome da unidade / empresa','text',true],['legal_name','Razão social','text'],['document','CNPJ / documento','text'],
      ['segment','Segmento','text'],['email','E-mail','email'],['phone','Telefone','tel'],['website','Site','url'],
      ['status','Status','select',true,['active','inactive']],['notes','Observações','textarea']
    ]
  },
  Clientes: {
    table: 'clients', title: 'Clientes', singular: 'cliente',
    fields: [
      ['name','Nome / empresa do cliente','text',true],['contact_person','Pessoa de contato','text'],['document','CPF / CNPJ','text'],
      ['email','E-mail','email'],['phone','Telefone','tel'],['segment','Segmento','text'],['source','Origem do contato','text'],
      ['company_id','Unidade responsável','company'],['status','Status','select',true,['active','prospect','inactive']],['notes','Observações','textarea']
    ]
  }
};

const moduleOptions = [
  ['companies','Empresas'],['clients','Clientes'],['crm','CRM Comercial'],['projects','Projetos'],
  ['tasks','Tarefas'],['calendar','Calendário'],['finance','Financeiro'],['digital_presence','Presença Digital'],
  ['connect','GNR Connect'],['tickets','Chamados'],['client_portal','Portal do Cliente'],
  ['performance','GNR Performance'],['mentoring','Mentoria'],['reports','Relatórios']
];
const blank = { name:'', legal_name:'', document:'', segment:'', email:'', phone:'', website:'', status:'active', notes:'', contact_person:'', source:'', company_id:'' };
const statusText = { active:'Ativo', inactive:'Inativo', prospect:'Prospect', invited:'Convite enviado', suspended:'Suspenso' };

export default function ManagementModule({ active, profile, permissions = [] }) {
  const isTeam = active === 'Equipe';
  const cfg = config[active];
  const modulePermissionKey = active === 'Empresas' ? 'companies' : 'clients';
  const canManage = ['master','admin'].includes(profile?.role) || !!permissions.find(p=>p.module_key===modulePermissionKey)?.can_manage;
  const [rows,setRows] = useState([]);
  const [companies,setCompanies] = useState([]);
  const [search,setSearch] = useState('');
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState(blank);
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(true);
  const [notice,setNotice] = useState('');
  const [memberOpen,setMemberOpen] = useState(false);
  const [member,setMember] = useState({full_name:'',email:'',role:'staff'});
  const [draftPermissions,setDraftPermissions] = useState({});

  async function load() {
    setLoading(true); setNotice('');
    if (isTeam) {
      const {data,error} = await supabase.from('profiles').select('user_id,email,full_name,role,status,created_at').order('created_at',{ascending:false});
      if (error) setNotice(error.message); else setRows(data || []);
    } else if (cfg) {
      const [result, companyResult] = await Promise.all([
        supabase.from(cfg.table).select('*').order('created_at',{ascending:false}),
        supabase.from('companies').select('id,name').eq('status','active').order('name')
      ]);
      if (result.error) setNotice(result.error.message); else setRows(result.data || []);
      if (!companyResult.error) setCompanies(companyResult.data || []);
    }
    setLoading(false);
  }

  useEffect(()=>{ load(); },[active]);

  const filtered = useMemo(()=>rows.filter(row=>{
    const q=search.trim().toLowerCase();
    if(!q) return true;
    return [row.name,row.email,row.phone,row.document,row.full_name,row.role,row.status].some(v=>String(v||'').toLowerCase().includes(q));
  }),[rows,search]);

  function openNew(){ setEditing('new'); setForm({...blank}); setNotice(''); }
  function openEdit(row){ setEditing(row.id); setForm({...blank,...row,company_id:row.company_id||''}); setNotice(''); }
  function closeForm(){ setEditing(null); setForm(blank); }

  function openMemberForm(){
    setMember({full_name:'',email:'',role:'staff'});
    setDraftPermissions({});
    setMemberOpen(true);
    setNotice('');
  }

  function togglePermission(key, field, value) {
    setDraftPermissions(current => {
      const previous = current[key] || {can_view:false,can_manage:false};
      const next = {...previous,[field]:value};
      if (field==='can_view' && !value) next.can_manage=false;
      if (field==='can_manage' && value) next.can_view=true;
      return {...current,[key]:next};
    });
  }

  async function inviteMember(event) {
    event.preventDefault();
    setBusy(true); setNotice('');
    const selectedPermissions = moduleOptions
      .map(([module_key]) => ({module_key,...(draftPermissions[module_key] || {can_view:false,can_manage:false})}))
      .filter(p=>p.can_view);
    const payload = {
      full_name:member.full_name.trim(),
      email:member.email.trim(),
      role:member.role,
      permissions: member.role==='performance'
        ? [{module_key:'performance',can_view:true,can_manage:!!draftPermissions.performance?.can_manage}]
        : selectedPermissions
    };
    const {data,error} = await supabase.functions.invoke('hub-invite-member',{body:payload});
    setBusy(false);
    if(error){setNotice(error.message || 'Não foi possível enviar o convite.');return;}
    if(data?.error){setNotice(data.error);return;}
    setMemberOpen(false);
    setNotice('Convite enviado para '+member.email+'. O usuário deverá acessar o e-mail para definir a senha.');
    await load();
  }

  async function save(event){
    event.preventDefault(); if(!cfg) return;
    setBusy(true); setNotice('');
    const payload = Object.fromEntries(cfg.fields.map(([key]) => [key, form[key] ?? '']));
    if(cfg.table==='clients') payload.company_id=payload.company_id||null;
    const result=editing==='new'
      ? await supabase.from(cfg.table).insert(payload)
      : await supabase.from(cfg.table).update(payload).eq('id',editing);
    setBusy(false);
    if(result.error){setNotice(result.error.message);return;}
    closeForm(); setNotice('Registro salvo.'); await load();
  }

  async function remove(row){
    if(!window.confirm('Excluir este registro? Esta ação não poderá ser desfeita.')) return;
    const {error}=await supabase.from(cfg.table).delete().eq('id',row.id);
    if(error) setNotice(error.message); else {setNotice('Registro excluído.'); await load();}
  }

  if(!cfg && !isTeam) return null;

  return <section className="management-page">
    <div className="management-heading">
      <div><span className="eyebrow">{isTeam?'CONTROLE DE ACESSO':'CADASTROS-BASE'}</span><h1>{isTeam?'Equipe e usuários':cfg.title}</h1><p>{isTeam?'Convide membros e conceda somente os módulos necessários.':'Organize os cadastros que alimentam a operação do HUB GNR.'}</p></div>
      {isTeam ? profile?.role==='master' && <button className="primary management-add" onClick={openMemberForm}>+ Adicionar membro</button> : canManage && <button className="primary management-add" onClick={openNew}>+ Novo {cfg.singular}</button>}
    </div>
    <div className="management-toolbar"><div className="management-count"><strong>{rows.length}</strong><span>{isTeam?'usuários cadastrados':cfg.singular+'(s) cadastrados'}</span></div><input aria-label="Buscar registros" placeholder="Buscar por nome, e-mail ou documento..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
    {notice && <div className="management-notice" role="status">{notice}</div>}
    {loading ? <div className="management-empty">Carregando dados...</div> : filtered.length===0 ? <div className="management-empty"><b>Nenhum registro encontrado.</b><span>{rows.length===0?'Cadastre o primeiro registro para começar.':'Tente ajustar sua busca.'}</span></div> :
      <div className="management-table-wrap"><table className="management-table"><thead><tr>{(isTeam?['Nome','E-mail','Perfil','Status','Cadastro']:['Nome','Contato','Documento','Status','Ações']).map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
        {filtered.map(row=><tr key={row.id||row.user_id}>
          {isTeam ? <><td><b>{row.full_name||'—'}</b></td><td>{row.email||'—'}</td><td><span className="role-chip">{row.role}</span></td><td><span className={'status-chip '+row.status}>{statusText[row.status]||row.status}</span></td><td>{row.created_at?new Date(row.created_at).toLocaleDateString('pt-BR'):'—'}</td></> :
          <><td><b>{row.name}</b></td><td>{row.email||row.phone||row.contact_person||'—'}</td><td>{row.document||'—'}</td><td><span className={'status-chip '+row.status}>{statusText[row.status]||row.status}</span></td><td className="management-actions">{canManage ? <><button onClick={()=>openEdit(row)}>Editar</button><button className="danger-action" onClick={()=>remove(row)}>Excluir</button></> : <span className="role-chip">Somente leitura</span>}</td></>}
        </tr>)}
      </tbody></table></div>}
    {isTeam && <p className="management-footnote">Somente o Master pode enviar convites. Cada membro recebe acesso individual por módulo; nenhum acesso operacional é concedido automaticamente.</p>}
    {editing!==null && cfg && <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)closeForm();}}><form className="management-modal" onSubmit={save}>
      <div className="modal-head"><div><span className="eyebrow">CADASTRO</span><h2>{editing==='new'?'Novo '+cfg.singular:'Editar '+cfg.singular}</h2></div><button type="button" className="modal-close" onClick={closeForm}>×</button></div>
      <div className="management-form-grid">{cfg.fields.map(([key,label,type,required,options])=><label key={key} className={type==='textarea'?'field-wide':''}>{label}{type==='textarea'?<textarea value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})} rows="3"/>:type==='select'?<select required={required} value={form[key]||'active'} onChange={e=>setForm({...form,[key]:e.target.value})}>{options.map(o=><option key={o} value={o}>{statusText[o]||o}</option>)}</select>:type==='company'?<select value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}><option value="">Nenhuma unidade vinculada</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>:<input type={type} required={required} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}/>}</label>)}</div>
      <div className="modal-actions"><button type="button" className="secondary" onClick={closeForm}>Cancelar</button><button className="primary" disabled={busy}>{busy?'Salvando...':'Salvar cadastro'}</button></div>
    </form></div>}
    {memberOpen && <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget && !busy)setMemberOpen(false);}}><form className="management-modal member-modal" onSubmit={inviteMember}>
      <div className="modal-head"><div><span className="eyebrow">NOVO ACESSO</span><h2>Adicionar membro à equipe</h2></div><button type="button" className="modal-close" disabled={busy} onClick={()=>setMemberOpen(false)}>×</button></div>
      <div className="management-form-grid">
        <label className="field-wide">Nome completo<input required value={member.full_name} onChange={e=>setMember({...member,full_name:e.target.value})} autoComplete="name"/></label>
        <label className="field-wide">E-mail de acesso<input required type="email" value={member.email} onChange={e=>setMember({...member,email:e.target.value})} autoComplete="email"/></label>
        <label className="field-wide">Perfil<select value={member.role} onChange={e=>setMember({...member,role:e.target.value})}><option value="staff">Equipe — acesso individual</option><option value="performance">Tráfego pago — GNR Performance</option><option value="client">Cliente — acesso individual</option></select></label>
      </div>
      {member.role==='performance' ? <div className="permission-group"><b>GNR Performance</b><label className="permission-row"><input type="checkbox" checked={true} readOnly/> Visualizar módulo</label><label className="permission-row"><input type="checkbox" checked={!!draftPermissions.performance?.can_manage} onChange={e=>togglePermission('performance','can_manage',e.target.checked)}/> Gerenciar dados e campanhas</label></div> :
        <div className="permission-group"><div className="permission-heading"><b>Permissões por módulo</b><small>Sem seleção, o membro não terá acesso ao módulo.</small></div>
          {moduleOptions.map(([key,label])=><div className="permission-row-wrap" key={key}><span>{label}</span><label><input type="checkbox" checked={!!draftPermissions[key]?.can_view} onChange={e=>togglePermission(key,'can_view',e.target.checked)}/> Visualizar</label><label><input type="checkbox" checked={!!draftPermissions[key]?.can_manage} onChange={e=>togglePermission(key,'can_manage',e.target.checked)}/> Gerenciar</label></div>)}
        </div>}
      <p className="management-footnote">O convite será enviado pelo Supabase Auth. O membro precisará abrir o e-mail e definir a própria senha.</p>
      <div className="modal-actions"><button type="button" className="secondary" disabled={busy} onClick={()=>setMemberOpen(false)}>Cancelar</button><button className="primary" disabled={busy}>{busy?'Enviando convite...':'Enviar convite'}</button></div>
    </form></div>}
  </section>;
}
