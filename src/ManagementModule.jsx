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

const blank = { name:'', legal_name:'', document:'', segment:'', email:'', phone:'', website:'', status:'active', notes:'', contact_person:'', source:'', company_id:'' };
const statusText = { active:'Ativo', inactive:'Inativo', prospect:'Prospect' };

export default function ManagementModule({ active }) {
  const isTeam = active === 'Equipe';
  const cfg = config[active];
  const [rows,setRows] = useState([]);
  const [companies,setCompanies] = useState([]);
  const [search,setSearch] = useState('');
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState(blank);
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(true);
  const [notice,setNotice] = useState('');

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

  async function save(event){
    event.preventDefault(); if(!cfg) return;
    setBusy(true); setNotice('');
    const payload={...form};
    if(cfg.table==='clients') payload.company_id=payload.company_id||null;
    delete payload.id; delete payload.created_at; delete payload.updated_at; delete payload.created_by;
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
      <div><span className="eyebrow">{isTeam?'CONTROLE DE ACESSO':'CADASTROS-BASE'}</span><h1>{isTeam?'Equipe e usuários':cfg.title}</h1><p>{isTeam?'Consulte os perfis cadastrados e suas permissões atuais.':'Organize os cadastros que alimentam a operação do HUB GNR.'}</p></div>
      {!isTeam && <button className="primary management-add" onClick={openNew}>+ Novo {cfg.singular}</button>}
    </div>
    <div className="management-toolbar"><div className="management-count"><strong>{rows.length}</strong><span>{isTeam?'usuários cadastrados':cfg.singular+'(s) cadastrados'}</span></div><input aria-label="Buscar registros" placeholder="Buscar por nome, e-mail ou documento..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
    {notice && <div className="management-notice" role="status">{notice}</div>}
    {loading ? <div className="management-empty">Carregando dados...</div> : filtered.length===0 ? <div className="management-empty"><b>Nenhum registro encontrado.</b><span>{rows.length===0?'Cadastre o primeiro registro para começar.':'Tente ajustar sua busca.'}</span></div> :
      <div className="management-table-wrap"><table className="management-table"><thead><tr>{(isTeam?['Nome','E-mail','Perfil','Status','Cadastro']:['Nome','Contato','Documento','Status','Ações']).map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
        {filtered.map(row=><tr key={row.id||row.user_id}>
          {isTeam ? <><td><b>{row.full_name||'—'}</b></td><td>{row.email||'—'}</td><td><span className="role-chip">{row.role}</span></td><td><span className={'status-chip '+row.status}>{statusText[row.status]||row.status}</span></td><td>{row.created_at?new Date(row.created_at).toLocaleDateString('pt-BR'):'—'}</td></> :
          <><td><b>{row.name}</b></td><td>{row.email||row.phone||row.contact_person||'—'}</td><td>{row.document||'—'}</td><td><span className={'status-chip '+row.status}>{statusText[row.status]||row.status}</span></td><td className="management-actions"><button onClick={()=>openEdit(row)}>Editar</button><button className="danger-action" onClick={()=>remove(row)}>Excluir</button></td></>}
        </tr>)}
      </tbody></table></div>}
    {isTeam && <p className="management-footnote">Nesta etapa a equipe está em modo de consulta. Convites, alteração de perfis e suspensão de acesso exigem uma função segura no servidor; não serão executados diretamente pelo navegador.</p>}
    {editing!==null && cfg && <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)closeForm();}}><form className="management-modal" onSubmit={save}>
      <div className="modal-head"><div><span className="eyebrow">CADASTRO</span><h2>{editing==='new'?'Novo '+cfg.singular:'Editar '+cfg.singular}</h2></div><button type="button" className="modal-close" onClick={closeForm}>×</button></div>
      <div className="management-form-grid">{cfg.fields.map(([key,label,type,required,options])=><label key={key} className={type==='textarea'?'field-wide':''}>{label}{type==='textarea'?<textarea value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})} rows="3"/>:type==='select'?<select required={required} value={form[key]||'active'} onChange={e=>setForm({...form,[key]:e.target.value})}>{options.map(o=><option key={o} value={o}>{statusText[o]||o}</option>)}</select>:type==='company'?<select value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}><option value="">Nenhuma unidade vinculada</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>:<input type={type} required={required} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}/>}</label>)}</div>
      <div className="modal-actions"><button type="button" className="secondary" onClick={closeForm}>Cancelar</button><button className="primary" disabled={busy}>{busy?'Salvando...':'Salvar cadastro'}</button></div>
    </form></div>}
  </section>;
}
