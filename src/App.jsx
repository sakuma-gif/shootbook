import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://vuwveaqwecvstqtmjmzz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1d3ZlYXF3ZWN2c3RxdG1qbXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTEwOTgsImV4cCI6MjA5MjIyNzA5OH0.G24DwwyOTjMmgCL-P7jbABIJpali7MhY8AiOQb9tb-U'
);

const DEPTS = [
  { id:"d1", name:"配信1部", sub:"MC / Pococha / Kライバー", label:"MC / Pococha / Kライバー（配信1部）", color:"#7C3AED" },
  { id:"d2", name:"配信2部", sub:"17LIVE",                    label:"17LIVE（配信2部）",                   color:"#E11D48" },
  { id:"d3", name:"配信3部", sub:"TikTok",                    label:"TikTok（配信3部）",                   color:"#0284C7" },
];
const LOCATIONS = [
  { id:"office", name:"オフィス", address:"〒153-0061 東京都目黒区中目黒1－8－8　目黒F2ビルディング 1F" },
  { id:"other",  name:"その他",  address:"" },
];

// テスト用スタッフは常にマージされる（動作確認用）
const TEST_STAFF = [
  { id:"s_test1", name:"テスト（カメラ）",    role:"camera",   email:"test-camera@example.com" },
  { id:"s_test2", name:"テスト（ヘアメイク）", role:"hairmake", email:"test-hairmake@example.com" },
];
const REAL_STAFF = [
  { id:"s1", name:"樫井勇弥",           role:"camera",   email:"" },
  { id:"s2", name:"富安優斗",           role:"camera",   email:"" },
  { id:"s3", name:"阿見悠華(長尾悠華)", role:"hairmake", email:"" },
  { id:"s4", name:"タナカユキコ",       role:"hairmake", email:"" },
];
const INIT_STAFF = [...REAL_STAFF, ...TEST_STAFF];

const INIT_EMPLOYEES = [
  { id:"e1", name:"TESTくん",  slackId:"TEST1234" },
  { id:"e2", name:"TESTちゃん", slackId:"TEST5678" },
];

const WD    = ["日","月","火","水","木","金","土"];
const pad   = n => String(n).padStart(2,"0");
const toYM  = (y,m) => `${y}-${pad(m)}`;
const toYMD = (y,m,d) => `${y}-${pad(m)}-${pad(d)}`;
const fmtY  = n => `¥${Number(n||0).toLocaleString()}`;
const NOW   = new Date();
const TODAY = toYMD(NOW.getFullYear(), NOW.getMonth()+1, NOW.getDate());

function makeSeed(staff) {
  const y=NOW.getFullYear(), m=NOW.getMonth()+1;
  const c1=staff.find(s=>s.role==="camera")?.id||"s1";
  const c2=staff.filter(s=>s.role==="camera")[1]?.id||c1;
  const hm=staff.find(s=>s.role==="hairmake")?.id||"s3";
  return [
    {id:"r1",date:toYMD(y,m,8), departments:["d1"],         staffId:c1, amount:50000,  content:"ライバー撮影 #01",     status:"confirmed", requester:"山田 花子"},
    {id:"r2",date:toYMD(y,m,15),departments:["d1","d2"],    staffId:c2, amount:80000,  content:"合同イベント撮影",     status:"pending",   requester:"鈴木 太郎"},
    {id:"r3",date:toYMD(y,m,20),departments:["d3"],         staffId:hm, amount:40000,  content:"TikTok企画ヘアメイク", status:"confirmed", requester:"佐藤 一郎"},
    {id:"r4",date:toYMD(y,m,25),departments:["d1","d2","d3"],staffId:c1,amount:150000, content:"全部署合同撮影",       status:"pending",   requester:"伊藤 次郎"},
  ];
}

const T = {
  bg:"#F5F5FB", sb:"#FFFFFF", card:"#FFFFFF", bdr:"#E8E8F2",
  text:"#1A1A35", sub:"#4A4A6A", muted:"#9595B5",
  acc:"#5B5FEE", accBg:"#EEEFFE",
  ok:"#059669", okBg:"#ECFDF5",
  warn:"#B45309", warnBg:"#FFFBEB",
  ng:"#DC2626", ngBg:"#FEF2F2",
};
const rowC = { display:"flex", alignItems:"center", gap:8 };
const cardS = { background:T.card, border:`1px solid ${T.bdr}`, borderRadius:12, boxShadow:"0 1px 6px rgba(0,0,0,.05)" };
const inp = { width:"100%", background:T.bg, border:`1px solid ${T.bdr}`, borderRadius:7, padding:"9px 12px", color:T.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
const frow = { marginBottom:15 };
const lbl = { display:"block", fontSize:11, color:T.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:.5, marginBottom:5 };

function Btn({ v="pri", sm, children, onClick, disabled, style={} }) {
  const styles = {
    pri:   { background:T.acc,    color:"#fff",    border:"none" },
    ghost: { background:"transparent", color:T.muted, border:`1px solid ${T.bdr}` },
    light: { background:T.accBg,  color:T.acc,    border:`1px solid ${T.acc}30` },
    ng:    { background:T.ngBg,   color:T.ng,     border:`1px solid ${T.ng}30` },
    ok:    { background:T.okBg,   color:T.ok,     border:`1px solid ${T.ok}30` },
    warn:  { background:T.warnBg, color:T.warn,   border:`1px solid ${T.warn}30` },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding:sm?"5px 11px":"8px 16px", borderRadius:6, cursor:disabled?"not-allowed":"pointer",
        fontSize:sm?11:13, fontWeight:600, transition:"all .14s", opacity:disabled?.5:1,
        ...(styles[v]||styles.pri), ...style }}>
      {children}
    </button>
  );
}
function Tag({ color, children }) {
  return <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:500, background:`${color}18`, color, border:`1px solid ${color}30` }}>{children}</span>;
}
function Chip({ color, children, onClick }) {
  return <span onClick={onClick} style={{ display:"block", fontSize:10, padding:"2px 6px", borderRadius:3, marginBottom:2, background:`${color}15`, color, border:`1px solid ${color}30`, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", cursor:onClick?"pointer":"default" }}>{children}</span>;
}
function StatusBadge({ s }) {
  if (s==="confirmed")  return <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, background:T.okBg,  color:T.ok,   border:`1px solid ${T.ok}40`,   fontWeight:600, whiteSpace:"nowrap" }}>確定</span>;
  if (s==="cancelled")  return <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, background:"#F3F4F6", color:"#6B7280", border:"1px solid #D1D5DB", fontWeight:600, whiteSpace:"nowrap" }}>キャンセル</span>;
  return <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, background:T.warnBg, color:T.warn, border:`1px solid ${T.warn}40`, fontWeight:600, whiteSpace:"nowrap" }}>承認待ち</span>;
}

// ─── カスタムダイアログ ────────────────────────────────────────────────────────
function Dialog({ title, message, type, onOk, onCancel, okLabel, cancelLabel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(26,26,53,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, padding:20 }}>
      <div style={{ background:T.card, borderRadius:14, width:360, boxShadow:"0 20px 60px rgba(0,0,0,.18)", padding:24, border:`1px solid ${T.bdr}` }}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>{title}</div>
        <div style={{ fontSize:13, color:T.sub, lineHeight:1.7, marginBottom:20 }}>{message}</div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
          {onCancel && <Btn v="ghost" onClick={onCancel}>{cancelLabel||"キャンセル"}</Btn>}
          <Btn v={type==="danger"?"ng":"pri"} onClick={onOk}>{okLabel||"OK"}</Btn>
        </div>
      </div>
    </div>
  );
}
function useDialog() {
  const [dlg, setDlg] = useState(null);
  const close = () => setDlg(null);
  const confirm = useCallback((title, message, onOk, onCancel) => {
    setDlg({ title, message, type:"confirm", onOk:()=>{ close(); onOk&&onOk(); }, onCancel:()=>{ close(); onCancel&&onCancel(); }, cancelLabel:"キャンセル", okLabel:"OK" });
  }, []);
  const alert = useCallback((title, message) => {
    setDlg({ title, message, type:"alert", onOk:close, okLabel:"閉じる" });
  }, []);
  const danger = useCallback((title, message, onOk) => {
    setDlg({ title, message, type:"danger", onOk:()=>{ close(); onOk&&onOk(); }, onCancel:close, cancelLabel:"キャンセル", okLabel:"削除する" });
  }, []);
  const node = dlg ? <Dialog {...dlg} /> : null;
  return { confirm, alert, danger, node };
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  }, []);
  const [year,  setYear]  = useState(NOW.getFullYear());
  const [month, setMonth] = useState(NOW.getMonth()+1);
  const [view,  setView]  = useState("calendar");
  const [staff, setStaff] = useState(INIT_STAFF);
  const [reqs,  setReqs]  = useState([]);
  const [ngs,   setNgs]   = useState([]);
  const [employees, setEmployees] = useState(INIT_EMPLOYEES);
  const [modal,    setModal]    = useState(null);
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [showPin,  setShowPin]  = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const ADMIN_PIN = "0000";
  const dlg = useDialog();

  useEffect(() => {
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    // Staff
    try {
      const { data } = await supabase.from('staff').select('*');
      if (data && data.length > 0) {
        setStaff([...data.map(s => ({ id:s.id, name:s.name, role:s.role, email:s.email||'' })), ...TEST_STAFF]);
      } else {
        for (const s of REAL_STAFF) await supabase.from('staff').upsert({ id:s.id, name:s.name, role:s.role, email:s.email||'' });
        setStaff([...REAL_STAFF, ...TEST_STAFF]);
      }
    } catch { setStaff([...REAL_STAFF, ...TEST_STAFF]); }
    // Requests
    try {
      const { data } = await supabase.from('requests').select('*');
      if (data) setReqs(data.map(r => ({
        id:r.id, date:r.date, platforms:r.platforms||[], departments:r.departments||[],
        category:r.category, location:r.location, locationNote:r.location_note||'',
        amount:r.amount||0, amountCamera:r.amount_camera||0, amountHairmake:r.amount_hairmake||0,
        content:r.content, requester:r.requester, requesterEmpId:r.requester_emp_id||'',
        requesterSlackId:r.requester_slack_id||'', staffId:r.staff_id||'',
        staffIdHairmake:r.staff_id_hairmake||'', status:r.status||'pending',
        komban:r.komban||'', compo:r.compo||'', note:r.note||'',
        slackThreadUrl:r.slack_thread_url||'', eventUrl:r.event_url||'',
      })));
    } catch {}
    // NG days
    try {
      const { data } = await supabase.from('ng_days').select('*');
      if (data) setNgs(data.map(n => ({ staffId:n.staff_id, date:n.date })));
    } catch {}
    // Employees
    try {
      const { data } = await supabase.from('employees').select('*');
      if (data && data.length > 0) setEmployees(data.map(e => ({ id:e.id, name:e.name, slackId:e.slack_id||'' })));
    } catch {}
  };

  const saveStaff = async v => {
    const withoutTest = v.filter(s => !s.id.startsWith("s_test"));
    setStaff([...withoutTest, ...TEST_STAFF]);
    try { for (const s of withoutTest) await supabase.from('staff').upsert({ id:s.id, name:s.name, role:s.role, email:s.email||'' }); } catch {}
  };
  const saveReqs = async v => {
    setReqs(v);
    try {
      const ids = v.map(r => r.id);
      const { data: all } = await supabase.from('requests').select('id');
      if (all) for (const row of all) if (!ids.includes(row.id)) await supabase.from('requests').delete().eq('id', row.id);
      for (const r of v) await supabase.from('requests').upsert({
        id:r.id, date:r.date, platforms:r.platforms||[], departments:r.departments||[],
        category:r.category, location:r.location, location_note:r.locationNote||'',
        amount:r.amount||0, amount_camera:r.amountCamera||0, amount_hairmake:r.amountHairmake||0,
        content:r.content, requester:r.requester, requester_emp_id:r.requesterEmpId||'',
        requester_slack_id:r.requesterSlackId||'', staff_id:r.staffId||'',
        staff_id_hairmake:r.staffIdHairmake||'', status:r.status||'pending',
        komban:r.komban||'', compo:r.compo||'', note:r.note||'',
        slack_thread_url:r.slackThreadUrl||'', event_url:r.eventUrl||'',
      });
    } catch {}
  };
  const saveNgs = async v => {
    setNgs(v);
    try {
      await supabase.from('ng_days').delete().neq('id', 0);
      for (const n of v) await supabase.from('ng_days').insert({ staff_id:n.staffId, date:n.date });
    } catch {}
  };
  const saveEmployees = async v => {
    setEmployees(v);
    try { for (const e of v) await supabase.from('employees').upsert({ id:e.id, name:e.name, slack_id:e.slackId||'' }); } catch {}
  };


  const handlePin = () => {
    if (pinInput === ADMIN_PIN) {
      setIsAdmin(true); setShowPin(false); setPinInput(""); setPinError(false);
      setView("list");
    } else {
      setPinError(true); setPinInput("");
    }
  };
  const handleLogout = () => {
    setIsAdmin(false);
    if (NAV_ADMIN.some(n => n.id===view)) setView("calendar");
  };

  const prevM = () => month===1 ? (setYear(y=>y-1), setMonth(12)) : setMonth(m=>m-1);
  const nextM = () => month===12 ? (setYear(y=>y+1), setMonth(1)) : setMonth(m=>m+1);

  const mReqs = useMemo(() => reqs.filter(r => r.date.startsWith(toYM(year,month))), [reqs,year,month]);
  const sum   = useMemo(() => ({
    count:  mReqs.filter(r=>r.status!=="cancelled").length,
    amount: mReqs.filter(r=>r.status!=="cancelled").reduce((s,r) => s+Number(r.amount||0), 0),
    joint:  mReqs.filter(r => r.departments.length>1 && r.status!=="cancelled").length,
    ng:     ngs.filter(n => n.date.startsWith(toYM(year,month))).length,
  }), [mReqs, ngs, year, month]);

  const openAdd  = (d="") => setModal({ req:null, initDate:d });
  const openEdit = req    => setModal({ req, initDate:req.date });

  const handleSave = req => {
    const hasNG = ngs.find(n => n.staffId===req.staffId && n.date===req.date);
    const doSave = () => {
      if (req.id) saveReqs(reqs.map(r => r.id===req.id ? req : r));
      else         saveReqs([...reqs, { ...req, id:Date.now().toString() }]);
      setModal(null);
    };
    if (hasNG) {
      const s = staff.find(x => x.id===req.staffId);
      dlg.confirm("NG日に依頼しますか？", `${s?.name} は ${req.date} がNG日です。それでも登録しますか？`, doSave);
    } else {
      doSave();
    }
  };

  const handleDel = id => {
    const r = reqs.find(x => x.id===id);
    dlg.danger("依頼を削除しますか？", `「${r?.content}」を削除します。この操作は元に戻せません。`, () => saveReqs(reqs.filter(r => r.id!==id)));
  };

  const toggleNG = (staffId, date) => {
    ngs.find(n => n.staffId===staffId && n.date===date)
      ? saveNgs(ngs.filter(n => !(n.staffId===staffId && n.date===date)))
      : saveNgs([...ngs, { staffId, date }]);
  };

  const NAV_PUBLIC = [
    { id:"calendar",  icon:"📅", label:"カレンダー" },
    { id:"notidemo",  icon:"📖", label:"使い方ガイド" },
  ];
  const NAV_ADMIN = [
    { id:"list",      icon:"📋", label:"依頼一覧" },
    { id:"department",icon:"🏢", label:"部署別" },
    { id:"staff",     icon:"👤", label:"担当別" },
    { id:"invoice",   icon:"🧾", label:"請求・申請" },
    { id:"staffmgmt", icon:"⚙️", label:"スタッフ管理" },
    { id:"empmgmt",   icon:"👥", label:"社員マスター" },
    { id:"gyosuimgmt",icon:"🏗️", label:"業推管理" },
    { id:"ng",        icon:"🚫", label:"NG日管理" },
  ];
  const NAV = [...NAV_PUBLIC, ...NAV_ADMIN];

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Sans',system-ui,sans-serif", fontSize:14, overflow:"hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#C8C8E0;border-radius:3px}button:hover{opacity:.8}input,select,textarea{font-family:inherit}`}</style>

      {/* Sidebar */}
      <aside style={{ width:230, background:T.sb, borderRight:`1px solid ${T.bdr}`, display:"flex", flexDirection:"column", padding:"18px 0", flexShrink:0, boxShadow:"2px 0 10px rgba(0,0,0,.05)" }}>
        <div style={{ padding:"0 18px 16px", borderBottom:`1px solid ${T.bdr}`, marginBottom:10 }}>
          <div style={{ fontSize:16, fontWeight:700, color:T.acc }}>📸 ShootBook</div>
          <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>撮影依頼管理システム</div>
        </div>

        <div style={{ ...rowC, padding:"10px 16px", justifyContent:"space-between" }}>
          <button onClick={prevM} style={{ background:T.bg, border:`1px solid ${T.bdr}`, borderRadius:6, color:T.sub, cursor:"pointer", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>‹</button>
          <span style={{ fontSize:13, fontWeight:700 }}>{year}年{month}月</span>
          <button onClick={nextM} style={{ background:T.bg, border:`1px solid ${T.bdr}`, borderRadius:6, color:T.sub, cursor:"pointer", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>›</button>
        </div>

        <div style={{ margin:"10px 12px 12px", background:T.accBg, borderRadius:10, padding:"12px 14px", border:`1px solid ${T.acc}25` }}>
          {[["依頼件数",sum.count+"件"],["合計金額",fmtY(sum.amount)],["合同撮影",sum.joint+"件"],["NG日数",sum.ng+"日"]].map(([l,v]) => (
            <div key={l} style={{ ...rowC, justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:11, color:T.muted }}>{l}</span>
              <span style={{ fontSize:12, fontWeight:700, color:T.acc }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ flex:1, overflowY:"auto" }}>
          {/* 一般メニュー */}
          {NAV_PUBLIC.map(n => {
            const a = view===n.id;
            return (
              <div key={n.id} onClick={() => setView(n.id)}
                style={{ ...rowC, padding:"9px 16px", cursor:"pointer", gap:9, fontSize:13,
                  color:a?T.acc:T.sub, background:a?T.accBg:"transparent",
                  borderLeft:a?`3px solid ${T.acc}`:"3px solid transparent",
                  fontWeight:a?600:400, transition:"all .12s" }}>
                <span style={{ fontSize:14, lineHeight:1 }}>{n.icon}</span>
                {n.label}
              </div>
            );
          })}

          {/* 管理者メニュー */}
          <div style={{ margin:"8px 12px 0", height:1, background:T.bdr }}/>
          {!isAdmin ? (
            <div onClick={() => setShowPin(true)}
              style={{ ...rowC, padding:"9px 16px", cursor:"pointer", gap:9, fontSize:13,
                color:T.muted, borderLeft:"3px solid transparent", transition:"all .12s" }}>
              <span style={{ fontSize:14 }}>🔐</span>
              <span>管理者</span>
              <span style={{ marginLeft:"auto", fontSize:9, color:T.muted }}>PIN</span>
            </div>
          ) : (
            <div>
              <div style={{ ...rowC, padding:"9px 16px 4px", gap:7, fontSize:11,
                color:T.acc, fontWeight:700, textTransform:"uppercase", letterSpacing:.5 }}>
                <span style={{ fontSize:13 }}>🔐</span>管理者
                <button onClick={handleLogout}
                  style={{ marginLeft:"auto", fontSize:9, background:T.ngBg, color:T.ng,
                    border:`1px solid ${T.ng}30`, borderRadius:3, padding:"2px 7px",
                    cursor:"pointer", fontWeight:600 }}>
                  退出
                </button>
              </div>
              {NAV_ADMIN.map(n => {
                const a = view===n.id;
                return (
                  <div key={n.id} onClick={() => setView(n.id)}
                    style={{ ...rowC, padding:"8px 16px 8px 26px", cursor:"pointer", gap:8, fontSize:13,
                      color:a?T.acc:T.sub, background:a?T.accBg:"transparent",
                      borderLeft:a?`3px solid ${T.acc}`:"3px solid transparent",
                      fontWeight:a?600:400, transition:"all .12s" }}>
                    <span style={{ fontSize:13, lineHeight:1 }}>{n.icon}</span>
                    {n.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding:"12px 14px", borderTop:`1px solid ${T.bdr}` }}>
          <div style={{ fontSize:10, color:T.muted, marginBottom:7, textTransform:"uppercase", letterSpacing:.5 }}>部署カラー</div>
          {DEPTS.map(d => (
            <div key={d.id} style={{ ...rowC, marginBottom:6, gap:7 }}>
              <span style={{ width:10, height:10, borderRadius:3, background:d.color, flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:T.text }}>{d.name}</div>
                <div style={{ fontSize:9, color:T.muted }}>{d.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <header style={{ ...rowC, padding:"13px 22px", background:T.card, borderBottom:`1px solid ${T.bdr}`, justifyContent:"space-between", flexShrink:0, boxShadow:"0 1px 5px rgba(0,0,0,.04)" }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>{NAV.find(n=>n.id===view)?.label}</div>
            <div style={{ fontSize:11, color:T.muted, marginTop:1 }}>{year}年{month}月</div>
          </div>
          <Btn onClick={() => openAdd()}>＋ 依頼を追加</Btn>
        </header>

        <div style={{ flex:1, overflow:"auto", padding:20 }}>
          {view==="calendar"   && <CalendarView  year={year} month={month} reqs={mReqs} ngs={ngs} staff={staff} onAdd={openAdd} onEdit={openEdit} />}
          {view==="department" && isAdmin && <DeptView      reqs={mReqs} />}
          {view==="staff"      && isAdmin && <StaffView     reqs={mReqs} ngs={ngs} staff={staff} year={year} month={month} />}
          {view==="list"       && isAdmin && <ListView      reqs={mReqs} staff={staff} onEdit={openEdit} onDel={handleDel} />}
          {view==="ng"         && isAdmin && <NGView ngs={ngs} reqs={reqs} staff={staff} year={year} month={month} onToggle={toggleNG} />}
          {view==="staffmgmt"  && isAdmin && <StaffMgmt    staff={staff} reqs={reqs} ngs={ngs} onSave={saveStaff} dlg={dlg} />}
          {view==="empmgmt"    && isAdmin && <EmployeeMgmt employees={employees} onSave={saveEmployees} dlg={dlg} />}
          {view==="notidemo"   && <NotiDemo />}
          {view==="invoice"    && isAdmin && <InvoiceView reqs={reqs} staff={staff} year={year} month={month} />}
          {view==="gyosuimgmt" && isAdmin && <GyosuiMgmt reqs={reqs} staff={staff} onEdit={openEdit} onSave={saveReqs} dlg={dlg} year={year} month={month} />}
        </div>
      </main>

      {/* PIN入力モーダル */}
      {showPin && (
        <div style={{ position:"fixed", inset:0, background:"rgba(26,26,53,.45)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000 }}>
          <div style={{ background:T.card, borderRadius:14, width:320, padding:28, boxShadow:"0 20px 60px rgba(0,0,0,.18)", border:`1px solid ${T.bdr}`, textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🔐</div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>管理者ページ</div>
            <div style={{ fontSize:12, color:T.muted, marginBottom:20 }}>4桁のPINコードを入力してください</div>
            <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:16 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:44, height:52, borderRadius:8, border:`2px solid ${pinError?T.ng:pinInput.length>i?T.acc:T.bdr}`,
                  background:pinInput.length>i?T.accBg:T.bg, display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:22, fontWeight:700, color:T.acc, transition:"all .15s" }}>
                  {pinInput.length>i?"●":""}
                </div>
              ))}
            </div>
            {pinError && <div style={{ fontSize:12, color:T.ng, marginBottom:10 }}>PINが違います。もう一度入力してください。</div>}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:10 }}>
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} onClick={() => { if(pinInput.length<4){ const p=pinInput+n; setPinInput(p); setPinError(false); if(p.length===4) setTimeout(()=>{ if(p===ADMIN_PIN){setIsAdmin(true);setShowPin(false);setPinInput("");setPinError(false);setView("list");}else{setPinError(true);setPinInput("");} },100); }}}
                  style={{ height:48, borderRadius:8, border:`1px solid ${T.bdr}`, background:T.bg, fontSize:18, fontWeight:600, cursor:"pointer", color:T.text }}>
                  {n}
                </button>
              ))}
              <div/>
              <button onClick={() => { if(pinInput.length<4){ const p=pinInput+"0"; setPinInput(p); setPinError(false); if(p.length===4) setTimeout(()=>{ if(p===ADMIN_PIN){setIsAdmin(true);setShowPin(false);setPinInput("");setPinError(false);setView("list");}else{setPinError(true);setPinInput("");} },100); }}}
                style={{ height:48, borderRadius:8, border:`1px solid ${T.bdr}`, background:T.bg, fontSize:18, fontWeight:600, cursor:"pointer", color:T.text }}>
                0
              </button>
              <button onClick={() => { setPinInput(p => p.slice(0,-1)); setPinError(false); }}
                style={{ height:48, borderRadius:8, border:`1px solid ${T.bdr}`, background:T.bg, fontSize:16, cursor:"pointer", color:T.muted }}>
                ⌫
              </button>
            </div>
            <button onClick={() => { setShowPin(false); setPinInput(""); setPinError(false); }}
              style={{ fontSize:12, color:T.muted, background:"none", border:"none", cursor:"pointer", marginTop:4 }}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {modal && <ReqModal req={modal.req} initDate={modal.initDate} ngs={ngs} reqs={reqs} staff={staff} employees={employees} onSave={handleSave} onClose={() => setModal(null)} dlg={dlg} />}
      {dlg.node}
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
function CalendarView({ year, month, reqs, ngs, staff, onAdd, onEdit }) {
  const days  = new Date(year, month, 0).getDate();
  const first = new Date(year, month-1, 1).getDay();
  const cells = [...Array(first).fill(null), ...Array.from({length:days}, (_,i) => i+1)];
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:4 }}>
        {WD.map((d,i) => <div key={d} style={{ textAlign:"center", padding:"5px 0", fontSize:11, fontWeight:600, color:i===0?"#DC2626":i===6?"#2563EB":T.muted }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
        {cells.map((d,i) => {
          if (!d) return <div key={`e${i}`} style={{ minHeight:88 }} />;
          const ds   = toYMD(year,month,d);
          const dayR = reqs.filter(r => r.date===ds && r.status!=="cancelled");
          const dayN = ngs.filter(n => n.date===ds);
          const isT  = ds===TODAY;
          const dow  = (first+d-1)%7;
          return (
            <div key={d} onClick={() => onAdd(ds)}
              style={{ minHeight:88, background:isT?T.accBg:T.card, border:`1px solid ${isT?T.acc+"70":T.bdr}`, borderRadius:8, padding:"6px 7px", cursor:"pointer", boxShadow:"0 1px 3px rgba(0,0,0,.03)", overflow:"hidden", minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:3, color:dow===0?"#DC2626":dow===6?"#2563EB":isT?T.acc:T.sub }}>
                {isT ? <span style={{ background:T.acc, color:"#fff", borderRadius:"50%", width:20, height:20, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>{d}</span> : d}
              </div>
              {dayN.length>0 && <span style={{ display:"block", fontSize:9, padding:"1px 5px", borderRadius:3, marginBottom:2, background:T.ngBg, color:T.ng, border:`1px solid ${T.ng}30` }}>🚫 {dayN.map(n => staff.find(s => s.id===n.staffId)?.name.split(/[\s(]/)[0]).join("/")}</span>}
              {dayR.map(r => {
                const col = DEPTS.find(d2 => d2.id===r.departments[0])?.color||"#888";
                return <Chip key={r.id} color={col} onClick={e => { e.stopPropagation(); onEdit(r); }}>{r.departments.length>1?"👥 ":""}{r.content}</Chip>;
              })}
            </div>
          );
        })}
      </div>
      <div style={{ ...rowC, marginTop:14, gap:14, flexWrap:"wrap" }}>
        {DEPTS.map(d => <span key={d.id} style={{ ...rowC, gap:5, fontSize:11, color:T.sub }}><span style={{ width:10, height:10, borderRadius:2, background:d.color, flexShrink:0 }}/>{d.name}</span>)}
        <span style={{ ...rowC, gap:5, fontSize:11, color:T.ng }}>🚫 NG日</span>
      </div>
    </div>
  );
}

// ─── Department View ──────────────────────────────────────────────────────────
function DeptView({ reqs }) {
  const stats = DEPTS.map(d => {
    const dr  = reqs.filter(r => r.departments.includes(d.id) && r.status!=="cancelled");
    const app = dr.reduce((s,r) => s+Number(r.amount||0)/r.departments.length, 0);
    return { ...d, count:dr.length, amount:Math.round(app), conf:dr.filter(r=>r.status==="confirmed").length, pend:dr.filter(r=>r.status==="pending").length };
  });
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:22 }}>
        {stats.map(d => (
          <div key={d.id} style={{ ...cardS, padding:"18px 20px", borderTop:`4px solid ${d.color}` }}>
            <div style={{ ...rowC, gap:8, marginBottom:14 }}>
              <span style={{ width:12, height:12, borderRadius:3, background:d.color, flexShrink:0 }}/>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>{d.name}</div>
                <div style={{ fontSize:10, color:T.muted }}>{d.sub}</div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[["依頼件数",d.count+"件",T.text],["按分後金額",fmtY(d.amount),d.color],["確定",d.conf+"件",T.ok],["承認待ち",d.pend+"件",T.warn]].map(([l,v,c]) => (
                <div key={l} style={{ background:T.bg, borderRadius:7, padding:"9px 11px", border:`1px solid ${T.bdr}` }}>
                  <div style={{ fontSize:10, color:T.muted, marginBottom:2 }}>{l}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...cardS, overflow:"hidden" }}>
        <div style={{ padding:"11px 16px", background:T.accBg, borderBottom:`1px solid ${T.bdr}`, fontSize:12, fontWeight:700, color:T.acc }}>按分明細プレビュー</div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:T.bg }}>
              {["日付","内容","部署","按分内訳","合計","ステータス"].map(h => (
                <th key={h} style={{ textAlign:"left", padding:"9px 14px", fontSize:11, fontWeight:600, color:T.muted, borderBottom:`1px solid ${T.bdr}`, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reqs.filter(r=>r.status!=="cancelled").length===0 && <tr><td colSpan={6} style={{ textAlign:"center", padding:"30px", color:T.muted }}>この月の依頼はありません</td></tr>}
            {[...reqs].filter(r=>r.status!=="cancelled").sort((a,b) => a.date.localeCompare(b.date)).map(r => (
              <tr key={r.id} style={{ borderBottom:`1px solid ${T.bdr}` }}>
                <td style={{ padding:"11px 14px", color:T.muted, fontSize:12, whiteSpace:"nowrap" }}>{r.date.slice(5)}</td>
                <td style={{ padding:"11px 14px", maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.content}</td>
                <td style={{ padding:"11px 14px" }}><div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>{r.departments.map(id => { const d=DEPTS.find(x=>x.id===id); return d?<Tag key={id} color={d.color}>{d.name}</Tag>:null; })}</div></td>
                <td style={{ padding:"11px 14px" }}><div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>{r.departments.map(id => { const d=DEPTS.find(x=>x.id===id); const sh=Math.round(Number(r.amount||0)/r.departments.length); return d?<span key={id} style={{ fontSize:11, color:d.color, fontWeight:600, whiteSpace:"nowrap" }}>{d.name} {fmtY(sh)}</span>:null; })}</div></td>
                <td style={{ padding:"11px 14px", fontWeight:700, color:T.acc, whiteSpace:"nowrap" }}>{fmtY(r.amount)}</td>
                <td style={{ padding:"11px 14px" }}><StatusBadge s={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Staff View ───────────────────────────────────────────────────────────────
function StaffView({ reqs, ngs, staff, year, month }) {
  return (
    <div>
      {[["📷 カメラ","camera"],["💄 ヘアメイク","hairmake"]].map(([title,role]) => {
        const grp = staff.filter(s => s.role===role);
        if (!grp.length) return null;
        return (
          <div key={role} style={{ marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.sub, marginBottom:10 }}>{title}</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:12 }}>
              {grp.map(s => {
                const sr  = reqs.filter(r => r.staffId===s.id && r.status!=="cancelled");
                const mng = ngs.filter(n => n.staffId===s.id && n.date.startsWith(toYM(year,month)));
                const pay = sr.reduce((t,r) => t+Number(r.amount||0), 0);
                return (
                  <div key={s.id} style={{ ...cardS, padding:18 }}>
                    <div style={{ ...rowC, marginBottom:14 }}>
                      <div style={{ width:40, height:40, borderRadius:"50%", background:s.id.startsWith("s_test")?T.warnBg:T.accBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                        {role==="camera"?"📷":"💄"}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14 }}>{s.name}</div>
                        <div style={{ fontSize:11, color:T.muted }}>
                          {role==="camera"?"カメラ":"ヘアメイク"}
                          {s.id.startsWith("s_test") && <span style={{ marginLeft:6, fontSize:9, background:T.warnBg, color:T.warn, border:`1px solid ${T.warn}30`, borderRadius:3, padding:"1px 5px" }}>テスト</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:7, marginBottom:14 }}>
                      {[["稼働件数",sr.length+"件",T.acc],["月間報酬",fmtY(pay),T.ok],["NG日数",mng.length+"日",T.ng]].map(([l,v,c]) => (
                        <div key={l} style={{ background:T.bg, borderRadius:8, padding:"9px 10px", textAlign:"center", border:`1px solid ${T.bdr}` }}>
                          <div style={{ fontSize:9, color:T.muted, marginBottom:3 }}>{l}</div>
                          <div style={{ fontSize:14, fontWeight:700, color:c }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {sr.length>0 && (
                      <div>
                        <div style={{ fontSize:10, color:T.muted, marginBottom:5, fontWeight:600 }}>依頼一覧</div>
                        {sr.map(r => { const d=DEPTS.find(x=>x.id===r.departments[0]); return (
                          <div key={r.id} style={{ ...rowC, fontSize:11, marginBottom:5, gap:5 }}>
                            <span style={{ color:T.muted, minWidth:38, flexShrink:0 }}>{r.date.slice(5)}</span>
                            {r.departments.length>1 && <span>👥</span>}
                            <Tag color={d?.color||"#888"}>{d?.name}</Tag>
                            <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:T.sub }}>{r.content}</span>
                            <StatusBadge s={r.status} />
                          </div>
                        ); })}
                      </div>
                    )}
                    {mng.length>0 && (
                      <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${T.bdr}` }}>
                        <div style={{ fontSize:10, color:T.muted, marginBottom:4 }}>🚫 今月のNG日</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                          {mng.map(n => <span key={n.date} style={{ fontSize:10, padding:"2px 7px", borderRadius:4, background:T.ngBg, color:T.ng, border:`1px solid ${T.ng}30` }}>{n.date.slice(5)}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────
function ListView({ reqs, staff, onEdit, onDel }) {
  const sorted = [...reqs].filter(r => r.status!=="cancelled").sort((a,b) => a.date.localeCompare(b.date));
  return (
    <div style={{ ...cardS, overflow:"hidden" }}>
      {sorted.length===0 && <div style={{ textAlign:"center", padding:"50px", color:T.muted }}>この月の依頼はありません</div>}
      {sorted.length>0 && (
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:T.bg }}>
              {["日付","内容","部署","担当","金額","依頼者","ステータス",""].map(h => (
                <th key={h} style={{ textAlign:"left", padding:"10px 14px", fontSize:11, fontWeight:600, color:T.muted, borderBottom:`1px solid ${T.bdr}`, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(r => (
              <tr key={r.id} style={{ borderBottom:`1px solid ${T.bdr}` }}>
                <td style={{ padding:"11px 14px", color:T.muted, fontSize:12, whiteSpace:"nowrap" }}>{r.date.slice(5)}</td>
                <td style={{ padding:"11px 14px", maxWidth:150, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.departments.length>1&&<span style={{marginRight:4}}>👥</span>}{r.content}</td>
                <td style={{ padding:"11px 14px" }}><div style={{ display:"flex", flexDirection:"column", gap:3 }}>{r.departments.map(id => { const d=DEPTS.find(x=>x.id===id); return d?<Tag key={id} color={d.color}>{d.name}</Tag>:null; })}</div></td>
                <td style={{ padding:"11px 14px", fontSize:12, whiteSpace:"nowrap" }}>{staff.find(s=>s.id===r.staffId)?.name||"—"}</td>
                <td style={{ padding:"11px 14px", fontWeight:700, color:T.acc, whiteSpace:"nowrap" }}>{fmtY(r.amount)}</td>
                <td style={{ padding:"11px 14px", color:T.muted, fontSize:12, whiteSpace:"nowrap" }}>{r.requester||"—"}</td>
                <td style={{ padding:"11px 14px" }}><StatusBadge s={r.status} /></td>
                <td style={{ padding:"11px 14px" }}>
                  <div style={rowC}>
                    {r.slackThreadUrl && (
                      <a href={r.slackThreadUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize:11, color:"#5B5FEE", fontWeight:600, padding:"4px 8px", background:"#EEEFFE", borderRadius:4, border:"1px solid #5B5FEE30", textDecoration:"none", whiteSpace:"nowrap" }}>
                        Slack
                      </a>
                    )}
                    {r.status!=="cancelled" && <Btn v="ghost" sm onClick={() => onEdit(r)}>編集</Btn>}
                    <Btn v="ng" sm onClick={() => onDel(r.id)}>削除</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── NG View ──────────────────────────────────────────────────────────────────
function NGView({ ngs, reqs, staff, year, month, onToggle }) {
  const [sel, setSel] = useState(staff[0]?.id||"");
  const days  = new Date(year, month, 0).getDate();
  const first = new Date(year, month-1, 1).getDay();
  const cells = [...Array(first).fill(null), ...Array.from({length:days}, (_,i) => i+1)];
  const ngSet = new Set(ngs.filter(n => n.staffId===sel && n.date.startsWith(toYM(year,month))).map(n => n.date));
  const rqSet = new Set(reqs.filter(r => r.staffId===sel && r.date.startsWith(toYM(year,month)) && r.status!=="cancelled").map(r => r.date));
  if (!staff.length) return <div style={{ color:T.muted, padding:"40px", textAlign:"center" }}>スタッフが登録されていません</div>;
  return (
    <div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:18 }}>
        {staff.map(s => (
          <button key={s.id} onClick={() => setSel(s.id)}
            style={{ ...rowC, padding:"8px 14px", borderRadius:8, gap:6, cursor:"pointer", fontSize:13, fontWeight:sel===s.id?600:400,
              border:`1px solid ${sel===s.id?T.acc:T.bdr}`, background:sel===s.id?T.accBg:T.card, color:sel===s.id?T.acc:T.sub }}>
            {s.role==="camera"?"📷":"💄"} {s.name}
            {s.id.startsWith("s_test") && <span style={{ fontSize:9, background:T.warnBg, color:T.warn, borderRadius:3, padding:"1px 4px" }}>テスト</span>}
          </button>
        ))}
      </div>
      <div style={{ ...cardS, padding:18, maxWidth:500 }}>
        <div style={{ ...rowC, justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:700 }}>{staff.find(s=>s.id===sel)?.name}のNG日 <span style={{ color:T.ng, fontWeight:400, fontSize:12 }}>({ngSet.size}日)</span></div>
          <div style={{ ...rowC, gap:12, fontSize:11, color:T.muted }}>
            <span style={{ ...rowC, gap:4 }}><span style={{ width:12, height:12, borderRadius:3, background:T.ngBg, border:`1px solid ${T.ng}40`, flexShrink:0 }}/>NG（解除）</span>
            <span style={{ ...rowC, gap:4 }}><span style={{ width:12, height:12, borderRadius:3, background:T.warnBg, border:`1px solid ${T.warn}40`, flexShrink:0 }}/>依頼あり</span>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
          {WD.map((d,i) => <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:600, padding:"3px 0", color:i===0?"#DC2626":i===6?"#2563EB":T.muted }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
          {cells.map((d,i) => {
            if (!d) return <div key={`e${i}`} style={{ height:42 }} />;
            const ds  = toYMD(year,month,d);
            const isNG= ngSet.has(ds), hasR=rqSet.has(ds), isT=ds===TODAY;
            const dow = (first+d-1)%7;
            return (
              <div key={d} onClick={() => onToggle(sel,ds)}
                style={{ height:42, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", cursor:"pointer", fontSize:12, fontWeight:600, transition:"all .12s",
                  background:isNG?T.ngBg:hasR?T.warnBg:isT?T.accBg:T.bg,
                  border:`1px solid ${isNG?T.ng+"50":hasR?T.warn+"50":isT?T.acc+"60":T.bdr}`,
                  color:dow===0?"#DC2626":dow===6?"#2563EB":isT?T.acc:T.sub }}>
                {d}{isNG && <span style={{ fontSize:7, color:T.ng, marginTop:-1, lineHeight:1 }}>NG</span>}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:10, fontSize:12, color:T.muted }}>NG登録: <strong style={{ color:T.ng }}>{ngSet.size}日</strong></div>
      </div>
    </div>
  );
}

// ─── Staff Management ─────────────────────────────────────────────────────────
function StaffMgmt({ staff, reqs, ngs, onSave, dlg }) {
  const [form,    setForm]    = useState({ name:"", role:"camera", email:"" });
  const [err,     setErr]     = useState("");
  const [editId,  setEditId]  = useState(null);
  const [editEmail,setEditEmail] = useState("");

  const valid = email => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const add = () => {
    if (!form.name.trim()) { setErr("名前を入力してください"); return; }
    if (!valid(form.email)) { setErr("メールアドレスの形式が正しくありません"); return; }
    onSave([...staff, { id:"s"+Date.now(), name:form.name.trim(), role:form.role, email:form.email.trim() }]);
    setForm({ name:"", role:"camera", email:"" }); setErr("");
  };
  const del = id => {
    const s = staff.find(x => x.id===id);
    const cnt = reqs.filter(r => r.staffId===id).length;
    dlg.danger(`${s?.name}を削除しますか？`, cnt>0?`${cnt}件の依頼データも影響します。この操作は元に戻せません。`:"この操作は元に戻せません。", () => onSave(staff.filter(x => x.id!==id)));
  };
  const startEdit = s => { setEditId(s.id); setEditEmail(s.email||""); };
  const saveEmail = id => {
    if (!valid(editEmail)) { dlg.alert("入力エラー", "メールアドレスの形式が正しくありません"); return; }
    onSave(staff.map(s => s.id===id ? { ...s, email:editEmail.trim() } : s));
    setEditId(null);
  };

  const realStaff = staff.filter(s => !s.id.startsWith("s_test"));
  const emailOk   = realStaff.filter(s => s.email).length;
  const emailNg   = realStaff.filter(s => !s.email).length;

  return (
    <div style={{ maxWidth:620 }}>
      {/* テスト用バナー */}
      <div style={{ ...rowC, padding:"10px 14px", borderRadius:8, marginBottom:14, background:T.warnBg, border:`1px solid ${T.warn}30` }}>
        <span style={{ fontSize:14 }}>🔧</span>
        <div style={{ fontSize:12, color:T.warn }}>「テスト（カメラ）」「テスト（ヘアメイク）」は動作確認用で常に表示されます。依頼追加・通知デモで選択できます。</div>
      </div>

      {/* メール登録状況 */}
      <div style={{ ...rowC, padding:"12px 16px", borderRadius:10, marginBottom:18, background:emailNg>0?T.warnBg:T.okBg, border:`1px solid ${emailNg>0?T.warn+"50":T.ok+"50"}` }}>
        <span style={{ fontSize:18, marginRight:4 }}>{emailNg>0?"⚠️":"✅"}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:emailNg>0?T.warn:T.ok }}>
            {emailNg>0?`メール未登録のスタッフが ${emailNg}名います`:"全スタッフのメールアドレスが登録済みです"}
          </div>
          <div style={{ fontSize:11, color:T.muted, marginTop:1 }}>登録するとSTEP2以降で依頼通知メールが送れるようになります</div>
        </div>
        <div style={{ fontSize:12, color:T.muted, fontWeight:600 }}>{emailOk}/{realStaff.length}名 登録済み</div>
      </div>

      {/* 追加フォーム */}
      <div style={{ ...cardS, padding:22, marginBottom:20 }}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>スタッフを追加</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 130px", gap:10, marginBottom:10 }}>
          <div><label style={lbl}>名前</label><input value={form.name} onChange={e => { setForm(f=>({...f,name:e.target.value})); setErr(""); }} placeholder="例：樫井勇弥" style={inp} /></div>
          <div><label style={lbl}>役割</label><select value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))} style={inp}><option value="camera">📷 カメラ</option><option value="hairmake">💄 ヘアメイク</option></select></div>
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={lbl}>メールアドレス（後から追加もできます）</label>
          <input type="email" value={form.email} onChange={e => { setForm(f=>({...f,email:e.target.value})); setErr(""); }} placeholder="例：kashii@example.com" style={inp} />
        </div>
        {err && <div style={{ color:T.ng, fontSize:12, marginBottom:10 }}>{err}</div>}
        <Btn onClick={add}>＋ 追加する</Btn>
      </div>

      {/* スタッフリスト */}
      {[["📷 カメラ","camera"],["💄 ヘアメイク","hairmake"]].map(([title,role]) => {
        const grp = staff.filter(s => s.role===role);
        return (
          <div key={role} style={{ ...cardS, overflow:"hidden", marginBottom:14 }}>
            <div style={{ padding:"12px 16px", background:T.bg, borderBottom:`1px solid ${T.bdr}`, fontSize:13, fontWeight:700, color:T.sub }}>
              {title}<span style={{ fontWeight:400, color:T.muted, marginLeft:6 }}>({grp.length}名)</span>
            </div>
            {grp.length===0 && <div style={{ padding:"20px 16px", color:T.muted }}>登録なし</div>}
            {grp.map((s,i) => {
              const rc = reqs.filter(r => r.staffId===s.id).length;
              const nc = ngs.filter(n => n.staffId===s.id).length;
              const isTest   = s.id.startsWith("s_test");
              const isEditing= editId===s.id;
              return (
                <div key={s.id} style={{ padding:"14px 16px", borderTop:i>0?`1px solid ${T.bdr}`:"none", background:isTest?"rgba(245,158,11,.03)":"transparent" }}>
                  <div style={{ ...rowC, justifyContent:"space-between", marginBottom:isEditing?10:0 }}>
                    <div style={rowC}>
                      <div style={{ width:38, height:38, borderRadius:"50%", background:isTest?T.warnBg:T.accBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                        {role==="camera"?"📷":"💄"}
                      </div>
                      <div>
                        <div style={{ ...rowC, gap:6, fontWeight:600, fontSize:13 }}>
                          {s.name}
                          {isTest && <span style={{ fontSize:9, background:T.warnBg, color:T.warn, border:`1px solid ${T.warn}30`, borderRadius:3, padding:"1px 5px" }}>テスト</span>}
                        </div>
                        <div style={{ fontSize:11, color:T.muted, marginTop:1 }}>依頼 {rc}件 · NG登録 {nc}日</div>
                      </div>
                    </div>
                    <div style={rowC}>
                      {!isEditing && !isTest && <div style={{ marginRight:10, textAlign:"right" }}>{s.email?<span style={{ fontSize:11, color:T.ok, fontWeight:500 }}>✉ {s.email}</span>:<span style={{ fontSize:11, color:T.warn }}>⚠ 未登録</span>}</div>}
                      {isTest && <span style={{ fontSize:11, color:T.muted, marginRight:10 }}>✉ {s.email}</span>}
                      {!isEditing && !isTest && <Btn v="light" sm onClick={() => startEdit(s)}>メール{s.email?"編集":"登録"}</Btn>}
                      {!isEditing && !isTest && <Btn v="ng" sm onClick={() => del(s.id)} style={{ marginLeft:6 }}>削除</Btn>}
                      {isTest && <span style={{ fontSize:10, color:T.muted }}>（動作確認用・削除不可）</span>}
                    </div>
                  </div>
                  {isEditing && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto", gap:8, alignItems:"center", paddingLeft:46 }}>
                      <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="example@gmail.com" style={{ ...inp, padding:"7px 10px" }} autoFocus onKeyDown={e => { if(e.key==="Enter") saveEmail(s.id); if(e.key==="Escape") setEditId(null); }} />
                      <Btn v="ok" sm onClick={() => saveEmail(s.id)}>保存</Btn>
                      <Btn v="ghost" sm onClick={() => setEditId(null)}>キャンセル</Btn>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      <div style={{ ...cardS, padding:18, border:`1px solid ${T.acc}30`, background:T.accBg }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.acc, marginBottom:10 }}>次のステップ</div>
        {[["✅","STEP 1","メールアドレスの登録（今ここ）"],["⬜","STEP 2","Googleフォームを作成してOK/NG回答を受け付ける"],["⬜","STEP 3","Gmail連携で依頼通知メール送信 + Slack通知を実装"]].map(([icon,step,desc]) => (
          <div key={step} style={{ ...rowC, marginBottom:6, gap:8 }}><span style={{ fontSize:13 }}>{icon}</span><span style={{ fontSize:12, fontWeight:700, color:T.acc, minWidth:50 }}>{step}</span><span style={{ fontSize:12, color:T.sub }}>{desc}</span></div>
        ))}
      </div>
    </div>
  );
}

// ─── 通知デモ ─────────────────────────────────────────────────────────────────
const DEMO_STEPS = [
  { id:0, icon:"📋", label:"依頼登録" },
  { id:1, icon:"✉️", label:"メール送信" },
  { id:2, icon:"👆", label:"OK/NG 回答" },
  { id:3, icon:"💬", label:"Slack 通知" },
  { id:4, icon:"📅", label:"カレンダー反映" },
];
function NotiDemo() {
  const [tab, setTab] = useState("user");

  const GUIDE_USER = [
    {
      step: 1,
      icon: "📅",
      title: "カレンダーで日程を確認する",
      desc: "トップのカレンダーで撮影予定が入っている日を確認します。同じ日に他部署の撮影がある場合は合同撮影として依頼できます。",
      tips: ["他部署と同じ日に撮影する場合は、依頼フォームで複数のPFを選択してください", "カレンダーは全社員が閲覧できます"],
    },
    {
      step: 2,
      icon: "➕",
      title: "「＋ 依頼を追加」を押す",
      desc: "右上の「＋ 依頼を追加」ボタンから依頼フォームを開きます。",
      tips: [],
    },
    {
      step: 3,
      icon: "📝",
      title: "依頼内容を入力する",
      desc: "以下の項目をすべて入力してください。すべての必須項目（*）が埋まるとボタンが青くなります。",
      items: [
        ["📅 撮影日", "必須", "撮影を行う日付を選択"],
        ["📺 配信PF", "必須", "該当するプラットフォームを選択（複数可）"],
        ["💄 カテゴリ", "必須", "カメラ / ヘアメイク / 両方"],
        ["💴 希望金額", "必須", "カメラ・ヘアメイク別に入力（両方の場合）"],
        ["📍 撮影場所", "必須", "オフィスまたはその他（住所を記入）"],
        ["📝 撮影内容", "必須", "何を撮影するかを記入"],
        ["🙋 依頼者", "必須", "プルダウンから自分の名前を選択"],
        ["📎 事前申請URL", "必須", "イベントの事前申請書URLを貼り付け"],
        ["📋 香盤表", "任意", "後からSlackスレッドで提出もOK"],
        ["📄 コンポジ", "任意", "後からSlackスレッドで提出もOK"],
        ["💬 備考", "任意", "その他の連絡事項"],
      ],
      tips: [],
    },
    {
      step: 4,
      icon: "✅",
      title: "内容を確認して送信する",
      desc: "「内容を確認する →」を押すと確認画面が表示されます。内容に問題がなければ「この内容で送信する」を押してください。業推チームに通知が届きます。",
      tips: ["送信後の変更は業推チームに連絡してください"],
    },
    {
      step: 5,
      icon: "💬",
      title: "業推から確定連絡を受け取る",
      desc: "業推チームがカメラマン・ヘアメイクへの手配を完了したら、依頼時のSlackスレッドに確定連絡が届きます。",
      tips: ["香盤表・コンポジは撮影1週間前までにSlackスレッドに提出してください"],
    },
  ];

  const GUIDE_ADMIN = [
    {
      step: 1,
      icon: "🔐",
      title: "管理者ページにログインする",
      desc: "サイドバーの「🔐 管理者」をクリックし、4桁のPINコードを入力します。",
      tips: ["PINコードは業推チームのみ共有してください"],
    },
    {
      step: 2,
      icon: "🏗️",
      title: "業推管理で依頼を確認する",
      desc: "「業推管理」を開くと承認待ちの依頼が一覧表示されます。内容を確認してカメラマン・ヘアメイクへLINEで空き確認を行います。",
      tips: ["カレンダーでその日の既存依頼も確認できます"],
    },
    {
      step: 3,
      icon: "👤",
      title: "スタッフをアサインする",
      desc: "各依頼カードのプルダウンからカメラ担当・ヘアメイク担当を選択します。「両方」の依頼はそれぞれ別々に選択できます。",
      tips: ["アサインは選択した瞬間に自動保存されます"],
    },
    {
      step: 4,
      icon: "✅",
      title: "確定ボタンを押す",
      desc: "LINEでOKをもらったら「確定する」ボタンを押します。カレンダーに確定マークが表示され、Slack投稿用テキストが自動生成されます。",
      tips: [],
    },
    {
      step: 5,
      icon: "💬",
      title: "Slackで確定連絡を送る",
      desc: "自動生成されたテキストをコピーして、依頼が来たSlackスレッドに貼り付けて送信します。",
      items: [
        ["SlackスレッドURL", "業推管理の編集画面から登録しておくと「確定連絡を送る」リンクが出現します", ""],
      ],
      tips: ["香盤表・コンポジの提出期限（撮影1週間前）もスタッフに伝えてください"],
    },
    {
      step: 6,
      icon: "🧾",
      title: "請求書受取・バクラク申請",
      desc: "撮影完了後に請求書を受け取ったら「請求・申請」ページへ。サイドバーで稼働月を選択してスタッフを選ぶと申請テキストが自動生成されます。",
      tips: ["支払いは翌月末払いが自動入力されます", "コピーしてバクラクに貼り付けるだけで申請完了"],
    },
  ];

  const guide = tab==="user" ? GUIDE_USER : GUIDE_ADMIN;
  const accentColor = tab==="user" ? "#7C3AED" : T.acc;

  return (
    <div style={{ maxWidth:660 }}>
      {/* タブ切り替え */}
      <div style={{ ...rowC, gap:0, marginBottom:20, background:T.bg, borderRadius:10, padding:4, border:`1px solid ${T.bdr}` }}>
        {[["user","👤 依頼者向け"],["admin","🏗️ 業推チーム向け"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex:1, padding:"10px 0", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:700,
              background:tab===id?(id==="user"?"#7C3AED30":T.accBg):"transparent",
              color:tab===id?(id==="user"?"#7C3AED":T.acc):T.muted,
              transition:"all .15s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ガイドステップ */}
      {guide.map((g, i) => (
        <div key={g.step} style={{ display:"flex", gap:16, marginBottom:20 }}>
          {/* ステップ番号 */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:`${accentColor}15`,
              border:`2px solid ${accentColor}40`, display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:18, flexShrink:0 }}>
              {g.icon}
            </div>
            {i < guide.length-1 && <div style={{ width:2, flex:1, background:T.bdr, marginTop:6 }}/>}
          </div>

          {/* コンテンツ */}
          <div style={{ flex:1, paddingBottom:i < guide.length-1 ? 20 : 0 }}>
            <div style={{ ...rowC, gap:8, marginBottom:6 }}>
              <span style={{ fontSize:10, fontWeight:700, color:accentColor, background:`${accentColor}15`,
                border:`1px solid ${accentColor}30`, borderRadius:4, padding:"1px 7px" }}>
                STEP {g.step}
              </span>
              <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{g.title}</div>
            </div>
            <div style={{ fontSize:12, color:T.sub, lineHeight:1.8, marginBottom:g.items||g.tips?.length?10:0 }}>
              {g.desc}
            </div>

            {/* 項目リスト */}
            {g.items && (
              <div style={{ ...cardS, overflow:"hidden", marginBottom:8 }}>
                {g.items.map(([label, badge, desc]) => (
                  <div key={label} style={{ display:"grid", gridTemplateColumns:"120px auto 1fr",
                    gap:0, borderBottom:`1px solid ${T.bdr}`, padding:"8px 12px", alignItems:"center" }}>
                    <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{label}</div>
                    <span style={{ fontSize:10, padding:"1px 6px", borderRadius:4, fontWeight:600, marginRight:8,
                      background: badge==="必須"?T.ngBg:T.bg,
                      color: badge==="必須"?T.ng:T.muted,
                      border: `1px solid ${badge==="必須"?T.ng+"30":T.bdr}` }}>
                      {badge}
                    </span>
                    <div style={{ fontSize:11, color:T.muted }}>{desc}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tips */}
            {g.tips?.length>0 && (
              <div style={{ background:T.warnBg, border:`1px solid ${T.warn}30`, borderRadius:7, padding:"8px 12px" }}>
                {g.tips.map(t => (
                  <div key={t} style={{ ...rowC, gap:6, fontSize:11, color:T.warn, marginBottom:2 }}>
                    <span style={{ flexShrink:0 }}>💡</span>{t}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}



// ─── 請求・申請ビュー ──────────────────────────────────────────────────────────
function InvoiceView({ reqs, staff, year, month }) {
  const [selStaffId, setSelStaffId] = useState("");
  const [copied,     setCopied]     = useState(false);

  // 翌月末を自動計算（テキスト生成用）
  const nextMonth  = month===12 ? 1 : month+1;
  const nextYear   = month===12 ? year+1 : year;
  const lastDay    = new Date(nextYear, nextMonth, 0).getDate();
  const payDate    = `${nextYear}/${pad(nextMonth)}/${pad(lastDay)}`;

  const mReqs = reqs.filter(r =>
    r.date.startsWith(toYM(year,month)) &&
    r.status === "confirmed"
  );

  const selStaff  = staff.find(s => s.id===selStaffId);
  // カメラまたはヘアメイクどちらかでアサインされている依頼を取得
  const staffReqs = mReqs.filter(r =>
    r.staffId===selStaffId || r.staffIdHairmake===selStaffId
  );

  // 部署別按分集計
  const deptBreakdown = {};
  staffReqs.forEach(r => {
    const isCamera   = r.staffId===selStaffId;
    const isHairmake = r.staffIdHairmake===selStaffId;
    const amt = r.category==="both"
      ? (isCamera ? Number(r.amountCamera||0) : Number(r.amountHairmake||0))
      : Number(r.amount||0);
    r.departments.forEach(dId => {
      const share = Math.round(amt / r.departments.length);
      deptBreakdown[dId] = (deptBreakdown[dId]||0) + share;
    });
  });

  const totalAmt = Object.values(deptBreakdown).reduce((s,v) => s+v, 0);

  // コピー用テキスト生成
  const generateText = () => {
    if (!selStaff || staffReqs.length===0) return "";
    const lines = [];
    lines.push(`【${year}年${month}月分 外注費申請】`);
    lines.push(``);
    lines.push(`取引相手：${selStaff.name}`);
    lines.push(`支払金額：${fmtY(totalAmt)}`);
    lines.push(`支払期日：${payDate||"　　/　　"}`);
    lines.push(``);
    lines.push(`■ 内容`);
    staffReqs.forEach(r => {
      const deptNames = r.departments.map(id => DEPTS.find(x=>x.id===id)?.name).filter(Boolean).join("・");
      lines.push(`  ${r.date.slice(5)} ${r.content}（${deptNames}）`);
    });
    lines.push(``);
    lines.push(`■ 明細（部署別按分）`);
    Object.entries(deptBreakdown).forEach(([dId, amt]) => {
      const dept = DEPTS.find(x => x.id===dId);
      if (dept) lines.push(`  外注費 ／ ${dept.name} ／ ${fmtY(amt)}`);
    });
    lines.push(``);
    lines.push(`合計：${fmtY(totalAmt)}`);
    return lines.join("\n");
  };

  const text = generateText();

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  return (
    <div style={{ maxWidth:640 }}>
      {/* ヘッダー説明 */}
      <div style={{ ...cardS, padding:"12px 16px", marginBottom:18, background:T.accBg, border:`1px solid ${T.acc}25` }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.acc, marginBottom:2 }}>🧾 請求・申請 — {year}年{month}月稼働分</div>
        <div style={{ fontSize:11, color:T.sub, lineHeight:1.7 }}>サイドバーで稼働月を選択 → スタッフを選択すると申請用テキストが自動生成されます。コピーしてバクラクに貼り付けてください。支払期日は翌月末が自動入力されます。</div>
      </div>

      {/* スタッフ選択 */}
      <div style={{ ...cardS, padding:20, marginBottom:16 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom: selStaffId?12:0 }}>
          <div>
            <label style={lbl}>👤 スタッフ</label>
            <select value={selStaffId} onChange={e => { setSelStaffId(e.target.value); setCopied(false); }} style={inp}>
              <option value="">── 選択してください ──</option>
              {["camera","hairmake"].map(role => {
                const grp = staff.filter(s => s.role===role);
                if (!grp.length) return null;
                return (
                  <optgroup key={role} label={role==="camera"?"📷 カメラ":"💄 ヘアメイク"}>
                    {grp.map(s => {
                      const cnt = mReqs.filter(r => r.staffId===s.id || r.staffIdHairmake===s.id).length;
                      return <option key={s.id} value={s.id}>{s.name}（{cnt}件）</option>;
                    })}
                  </optgroup>
                );
              })}
            </select>
          </div>
          <div>
            <label style={lbl}>📅 稼働月</label>
            <div style={{ ...inp, background:T.bg, color:T.text, fontWeight:600, display:"flex", alignItems:"center" }}>
              {year}年{month}月
            </div>
            <div style={{ fontSize:10, color:T.muted, marginTop:3 }}>← サイドバーで変更できます</div>
          </div>
        </div>

        {selStaffId && staffReqs.length===0 && (
          <div style={{ textAlign:"center", padding:"20px", color:T.muted, fontSize:12 }}>
            この月の確定済み依頼はありません
          </div>
        )}

        {selStaffId && staffReqs.length>0 && (
          <div>
            {/* サマリーカード */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
              {[
                ["稼働件数", staffReqs.length+"件", T.acc],
                ["合計金額", fmtY(totalAmt), T.ok],
                ["関連部署", Object.keys(deptBreakdown).length+"部署", T.warn],
              ].map(([l,v,c]) => (
                <div key={l} style={{ background:T.bg, borderRadius:8, padding:"10px 12px", border:`1px solid ${T.bdr}`, textAlign:"center" }}>
                  <div style={{ fontSize:10, color:T.muted, marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:c }}>{v}</div>
                </div>
              ))}
            </div>

            {/* 部署別按分プレビュー */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:T.muted, fontWeight:600, marginBottom:6, textTransform:"uppercase", letterSpacing:.4 }}>部署別按分</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {Object.entries(deptBreakdown).map(([dId, amt]) => {
                  const dept = DEPTS.find(x => x.id===dId);
                  return dept ? (
                    <div key={dId} style={{ padding:"6px 12px", borderRadius:7, background:`${dept.color}12`, border:`1px solid ${dept.color}40`, fontSize:12 }}>
                      <span style={{ color:dept.color, fontWeight:700 }}>{dept.name}</span>
                      <span style={{ color:T.sub, marginLeft:8 }}>{fmtY(amt)}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 申請テキストプレビュー */}
      {selStaffId && staffReqs.length>0 && (
        <div style={{ ...cardS, overflow:"hidden" }}>
          <div style={{ ...rowC, padding:"12px 16px", background:T.bg, borderBottom:`1px solid ${T.bdr}`, justifyContent:"space-between" }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.sub }}>申請テキスト（コピー用）</div>
            <button onClick={handleCopy}
              style={{ fontSize:12, fontWeight:700, background:copied?T.okBg:T.accBg,
                color:copied?T.ok:T.acc, border:`1px solid ${copied?T.ok+"40":T.acc+"40"}`,
                borderRadius:6, padding:"6px 16px", cursor:"pointer", transition:"all .2s" }}>
              {copied ? "✓ コピーしました！" : "📋 コピー"}
            </button>
          </div>
          <pre style={{ margin:0, padding:"18px 20px", fontSize:13, lineHeight:1.9,
            color:T.text, background:T.card, whiteSpace:"pre-wrap", wordBreak:"break-all",
            fontFamily:"'DM Sans',system-ui,sans-serif" }}>
            {text}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── 業推管理ビュー ────────────────────────────────────────────────────────────
function GyosuiMgmt({ reqs, staff, onEdit, onSave, dlg, year, month }) {
  const mReqs = reqs.filter(r => r.date.startsWith(toYM(year,month)));
  const pending   = mReqs.filter(r => r.status==="pending");
  const confirmed = mReqs.filter(r => r.status==="confirmed");
  const cancelled = mReqs.filter(r => r.status==="cancelled");

  const confirmReq = (req) => {
    dlg.confirm(
      "この依頼を確定しますか？",
      `「${req.content}」（${req.date}）を確定します。`,
      () => onSave(reqs.map(r => r.id===req.id ? { ...r, status:"confirmed" } : r))
    );
  };
  const cancelReq = (req) => {
    dlg.danger(
      "依頼をキャンセルしますか？",
      `「${req.content}」（${req.date}）をキャンセルします。
履歴は残ります。`,
      () => onSave(reqs.map(r => r.id===req.id ? { ...r, status:"cancelled" } : r))
    );
  };
  const restoreReq = (req) => {
    dlg.confirm(
      "依頼を承認待ちに戻しますか？",
      `「${req.content}」（${req.date}）を承認待ちに戻します。`,
      () => onSave(reqs.map(r => r.id===req.id ? { ...r, status:"pending" } : r))
    );
  };
  const assignStaff = (reqId, field, staffId) => {
    onSave(reqs.map(r => r.id===reqId ? { ...r, [field]: staffId } : r));
  };

  const Section = ({ title, color, items }) => (
    <div style={{ marginBottom:24 }}>
      <div style={{ ...rowC, gap:8, marginBottom:10 }}>
        <span style={{ width:10, height:10, borderRadius:3, background:color, flexShrink:0 }}/>
        <div style={{ fontSize:13, fontWeight:700, color:T.sub }}>{title}</div>
        <span style={{ fontSize:11, color:T.muted }}>（{items.length}件）</span>
      </div>
      {items.length===0 && <div style={{ fontSize:12, color:T.muted, padding:"12px 16px", background:T.bg, borderRadius:8 }}>なし</div>}
      {items.map(r => {
        const dept  = DEPTS.find(d => d.id===r.departments?.[0]);
        const staffObj = staff.find(s => s.id===r.staffId);
        const hasSlack = !!r.slackThreadUrl;
        return (
          <div key={r.id} style={{ ...cardS, padding:"14px 16px", marginBottom:8 }}>
            <div style={{ ...rowC, justifyContent:"space-between", marginBottom:hasSlack||r.status==="pending"?10:0 }}>
              <div style={{ ...rowC, gap:10, flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, color:T.muted, flexShrink:0 }}>{r.date.slice(5)}</div>
                {dept && <Tag color={dept.color}>{dept.name}</Tag>}
                <div style={{ fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.content}</div>
                {r.category && <span style={{ fontSize:10, color:T.muted, flexShrink:0 }}>{r.category==="camera"?"📷":r.category==="hairmake"?"💄":"📷💄"}</span>}
                {r.staffId && r.category!=="both" && <span style={{ fontSize:10, color:T.ok, flexShrink:0 }}>→ {staff.find(s=>s.id===r.staffId)?.name||""}</span>}
                {r.category==="both" && r.staffId && <span style={{ fontSize:10, color:T.ok, flexShrink:0 }}>📷{staff.find(s=>s.id===r.staffId)?.name?.split(/[\s(]/)[0]||""}</span>}
                {r.category==="both" && r.staffIdHairmake && <span style={{ fontSize:10, color:T.ok, flexShrink:0 }}>💄{staff.find(s=>s.id===r.staffIdHairmake)?.name?.split(/[\s(]/)[0]||""}</span>}
              </div>
              <div style={{ ...rowC, gap:6, flexShrink:0 }}>
                {r.status!=="cancelled" && <Btn v="ghost" sm onClick={() => onEdit(r)}>編集</Btn>}
                {r.status==="pending" && <Btn v="ok" sm onClick={() => confirmReq(r)}>確定する</Btn>}
                {r.status!=="cancelled" && <Btn v="ng" sm onClick={() => cancelReq(r)}>キャンセル</Btn>}
                {r.status==="cancelled" && <Btn v="ghost" sm onClick={() => restoreReq(r)}>承認待ちに戻す</Btn>}
              </div>
            </div>

            {/* スタッフアサイン */}
            {r.status!=="cancelled" && (
              <div style={{ display:"grid", gridTemplateColumns: r.category==="both"?"1fr 1fr":"1fr", gap:8, marginBottom:10 }}>
                {(r.category==="camera" || r.category==="both") && (
                  <div>
                    <div style={{ fontSize:10, color:T.muted, fontWeight:600, marginBottom:4 }}>📷 カメラ担当</div>
                    <select value={r.staffId||""} onChange={e => assignStaff(r.id, "staffId", e.target.value)}
                      style={{ ...inp, padding:"6px 10px", fontSize:12 }}>
                      <option value="">── 未アサイン ──</option>
                      {staff.filter(s => s.role==="camera").map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {(r.category==="hairmake" || r.category==="both") && (
                  <div>
                    <div style={{ fontSize:10, color:T.muted, fontWeight:600, marginBottom:4 }}>💄 ヘアメイク担当</div>
                    <select value={r.staffIdHairmake||""} onChange={e => assignStaff(r.id, "staffIdHairmake", e.target.value)}
                      style={{ ...inp, padding:"6px 10px", fontSize:12 }}>
                      <option value="">── 未アサイン ──</option>
                      {staff.filter(s => s.role==="hairmake").map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Slackスレッドバー */}
            <div style={{ ...rowC, gap:8, padding:"8px 10px", background:T.bg, borderRadius:6, flexWrap:"wrap" }}>
              <div style={{ fontSize:11, color:T.muted, flexShrink:0 }}>🔗 Slackスレッド：</div>
              {hasSlack ? (
                <a href={r.slackThreadUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:11, color:T.acc, fontWeight:600, textDecoration:"none", flex:1,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {r.slackThreadUrl}
                </a>
              ) : (
                <span style={{ fontSize:11, color:T.warn }}>未登録 — 編集からURLを貼り付けてください</span>
              )}
              {hasSlack && r.status==="confirmed" && (
                <a href={r.slackThreadUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:11, color:"#fff", background:T.ok, padding:"3px 9px", borderRadius:4,
                    fontWeight:600, textDecoration:"none", flexShrink:0 }}>
                  確定連絡を送る ↗
                </a>
              )}
            </div>

            {/* 確定時：Slack投稿用テキスト自動生成 */}
            {r.status==="confirmed" && (
              <SlackDraftCard r={r} staff={staff} />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      {/* 説明バナー */}
      <div style={{ ...cardS, padding:"12px 16px", marginBottom:18, background:T.accBg, border:`1px solid ${T.acc}25` }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.acc, marginBottom:4 }}>🏗️ 業推チーム専用ビュー</div>
        <div style={{ fontSize:11, color:T.sub, lineHeight:1.7 }}>
          承認待ちの依頼を確認・確定できます。Slackスレッド URLを登録すると、確定後の投稿文が自動生成されます。
        </div>
      </div>

      <Section title="⏳ 承認待ち" color={T.warn}    items={pending} />
      <Section title="✅ 確定済み" color={T.ok}     items={confirmed} />
      {cancelled.length>0 && <Section title="🚫 キャンセル済み" color={T.muted} items={cancelled} />}
    </div>
  );
}

// Slack投稿文の自動生成カード
function SlackDraftCard({ r, staff }) {
  const [copied, setCopied] = useState(false);
  const dept   = r.departments?.map(id => DEPTS.find(x=>x.id===id)?.label).filter(Boolean).join("、");
  const staffObj = staff.find(s => s.id===r.staffId);
  const catLabel = r.category==="camera"?"📷 カメラ":r.category==="hairmake"?"💄 ヘアメイク":"📷💄 カメラ＋ヘアメイク";
  const locLabel = r.location==="office"?"オフィス（目黒F2ビルディング 1F）":(r.locationNote||"その他");
  const amtLabel = r.category==="both"
    ? `カメラ ${fmtY(r.amountCamera||0)} / ヘアメイク ${fmtY(r.amountHairmake||0)}`
    : fmtY(r.amount||0);

  const draft = [
    `✅ 撮影依頼が確定しました！`,
    ``,
    `📅 撮影日：${r.date}`,
    `📺 配信PF：${dept||"—"}`,
    `${catLabel}`,
    `📍 場所：${locLabel}`,
    `💴 金額：${amtLabel}`,
    `📝 内容：${r.content}`,
    r.komban ? `📋 香盤表：${r.komban}` : `📋 香盤表：撮影1週間前までにSlackスレッドへ提出をお願いします`,
    r.compo  ? `📄 コンポジ：${r.compo}` : `📄 コンポジ：撮影1週間前までにSlackスレッドへ提出をお願いします`,
    r.note   ? `💬 備考：${r.note}` : "",
    r.eventUrl ? `📎 事前申請：${r.eventUrl}` : "",
  ].filter(line => line !== null).join("\n");

  const copy = () => {
    navigator.clipboard.writeText(draft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div style={{ marginTop:10, background:"#1A1D21", borderRadius:8, padding:14 }}>
      <div style={{ ...rowC, justifyContent:"space-between", marginBottom:8 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.5)" }}>Slack投稿文（自動生成）</div>
        <button onClick={copy} style={{ fontSize:11, fontWeight:600, background:copied?"#1D9E75":"rgba(255,255,255,.1)", color:"#fff", border:"none", borderRadius:4, padding:"3px 10px", cursor:"pointer" }}>
          {copied ? "✓ コピーしました" : "コピー"}
        </button>
      </div>
      <pre style={{ fontSize:11, color:"rgba(255,255,255,.75)", lineHeight:1.8, margin:0, whiteSpace:"pre-wrap", wordBreak:"break-all" }}>{draft}</pre>
    </div>
  );
}

// ─── Employee Master ──────────────────────────────────────────────────────────
function EmployeeMgmt({ employees, onSave, dlg }) {
  const [form, setForm] = useState({ name:"", slackId:"" });
  const [err,  setErr]  = useState("");
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name:"", slackId:"" });

  const add = () => {
    if (!form.name.trim())   { setErr("名前を入力してください"); return; }
    if (!form.slackId.trim()){ setErr("Slack IDを入力してください"); return; }
    onSave([...employees, { id:"e"+Date.now(), name:form.name.trim(), slackId:form.slackId.trim().replace(/^@/,"") }]);
    setForm({ name:"", slackId:"" }); setErr("");
  };
  const del = id => {
    const e = employees.find(x => x.id===id);
    dlg.danger(`${e?.name}を削除しますか？`, "この操作は元に戻せません。", () => onSave(employees.filter(x => x.id!==id)));
  };
  const startEdit = e => { setEditId(e.id); setEditForm({ name:e.name, slackId:e.slackId }); };
  const saveEdit  = id => {
    if (!editForm.name.trim() || !editForm.slackId.trim()) return;
    onSave(employees.map(e => e.id===id ? { ...e, name:editForm.name.trim(), slackId:editForm.slackId.trim().replace(/^@/,"") } : e));
    setEditId(null);
  };

  return (
    <div style={{ maxWidth:560 }}>
      <div style={{ ...cardS, padding:"12px 16px", marginBottom:16, background:T.accBg, border:`1px solid ${T.acc}25` }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.acc, marginBottom:2 }}>👥 社員マスターとは？</div>
        <div style={{ fontSize:11, color:T.sub, lineHeight:1.7 }}>依頼フォームの「依頼者」プルダウンに表示される社員一覧です。Slack IDを登録しておくと、Slack通知時に自動でメンションされます。</div>
      </div>

      {/* 追加フォーム */}
      <div style={{ ...cardS, padding:22, marginBottom:20 }}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>社員を追加</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
          <div>
            <label style={lbl}>名前</label>
            <input value={form.name} onChange={e => { setForm(f=>({...f,name:e.target.value})); setErr(""); }}
              placeholder="例：山田 花子" style={inp} onKeyDown={e => e.key==="Enter"&&add()} />
          </div>
          <div>
            <label style={lbl}>Slack ID</label>
            <input value={form.slackId} onChange={e => { setForm(f=>({...f,slackId:e.target.value.replace(/^@/,"")})); setErr(""); }}
              placeholder="例：U0ABC1234" style={inp} onKeyDown={e => e.key==="Enter"&&add()} />
          </div>
        </div>
        {err && <div style={{ color:T.ng, fontSize:12, marginBottom:10 }}>{err}</div>}
        <Btn onClick={add}>＋ 追加する</Btn>
        <div style={{ fontSize:11, color:T.muted, marginTop:10, lineHeight:1.7 }}>
          💡 Slack IDの確認方法：Slackでプロフィールを開く →「その他」→「メンバーIDをコピー」（U から始まる英数字）
        </div>
      </div>

      {/* 社員一覧 */}
      <div style={{ ...cardS, overflow:"hidden" }}>
        <div style={{ padding:"12px 16px", background:T.bg, borderBottom:`1px solid ${T.bdr}`, fontSize:13, fontWeight:700, color:T.sub }}>
          登録済み社員 <span style={{ fontWeight:400, color:T.muted, marginLeft:6 }}>({employees.length}名)</span>
        </div>
        {employees.length===0 && <div style={{ padding:"24px 16px", color:T.muted, textAlign:"center" }}>登録なし</div>}
        {employees.map((emp, i) => {
          const isEditing = editId===emp.id;
          return (
            <div key={emp.id} style={{ padding:"13px 16px", borderTop:i>0?`1px solid ${T.bdr}`:"none" }}>
              {!isEditing ? (
                <div style={{ ...rowC, justifyContent:"space-between" }}>
                  <div style={{ ...rowC, gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:T.accBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>👤</div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{emp.name}</div>
                      <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>
                        Slack: <code style={{ background:T.bg, padding:"1px 6px", borderRadius:3, border:`1px solid ${T.bdr}` }}>@{emp.slackId||"未登録"}</code>
                      </div>
                    </div>
                  </div>
                  <div style={{ ...rowC, gap:6 }}>
                    <Btn v="light" sm onClick={() => startEdit(emp)}>編集</Btn>
                    <Btn v="ng"    sm onClick={() => del(emp.id)}>削除</Btn>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                    <input value={editForm.name} onChange={e => setEditForm(f=>({...f,name:e.target.value}))}
                      placeholder="名前" style={{ ...inp, padding:"7px 10px" }} autoFocus />
                    <input value={editForm.slackId} onChange={e => setEditForm(f=>({...f,slackId:e.target.value.replace(/^@/,"")}))}
                      placeholder="Slack ID" style={{ ...inp, padding:"7px 10px" }} />
                  </div>
                  <div style={{ ...rowC, gap:8 }}>
                    <Btn v="ok"    sm onClick={() => saveEdit(emp.id)}>保存</Btn>
                    <Btn v="ghost" sm onClick={() => setEditId(null)}>キャンセル</Btn>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Request Modal ────────────────────────────────────────────────────────────
function ReqModal({ req, initDate, ngs, reqs, staff, employees, onSave, onClose, dlg }) {
  const def = toYMD(NOW.getFullYear(), NOW.getMonth()+1, NOW.getDate());
  const [form, setForm] = useState({
    id:          req?.id||"",
    date:        req?.date||initDate||def,
    platforms:   req?.platforms||[],
    category:    req?.category||"camera",
    location:    req?.location||"office",
    locationNote:req?.locationNote||"",
    amount:      req?.amount||"",
    content:     req?.content||"",
    requester:        req?.requester||"",
    requesterSlackId: req?.requesterSlackId||"",
    requesterEmpId:   req?.requesterEmpId||"",
    slackThreadUrl:   req?.slackThreadUrl||"",
    eventUrl:         req?.eventUrl||"",
    amountCamera:   req?.amountCamera||"",
    amountHairmake: req?.amountHairmake||"",
    komban:      req?.komban||"",
    compo:       req?.compo||"",
    note:        req?.note||"",
  });
  const [err, setErr] = useState("");

  const set     = (k,v) => setForm(f => ({ ...f, [k]:v }));
  const toggleP = id   => set("platforms", form.platforms.includes(id) ? form.platforms.filter(d=>d!==id) : [...form.platforms, id]);
  const share   = form.platforms.length>0 ? Math.round((Number(form.amount)||0)/form.platforms.length) : 0;

  const [showConfirm, setShowConfirm] = useState(false);

  const hasAmount = form.category==="both"
    ? (Number(form.amountCamera)>0 || Number(form.amountHairmake)>0)
    : Number(form.amount)>0;

  const canSubmit =
    !!form.date &&
    form.platforms.length>0 &&
    !!form.content.trim() &&
    !!form.requester.trim() &&
    hasAmount &&
    (form.location!=="other" || !!form.locationNote.trim()) &&
    !!form.eventUrl.trim();

  const submit = () => {
    if (!form.date)               { setErr("撮影日を選択してください"); return; }
    if (form.platforms.length===0){ setErr("配信プラットフォームを1つ以上選択してください"); return; }
    if (!form.content.trim())     { setErr("撮影内容を入力してください"); return; }
    if (!form.requester.trim())   { setErr("依頼者を選択してください"); return; }
    if (!hasAmount)               { setErr("希望金額を入力してください"); return; }
    if (form.location==="other" && !form.locationNote.trim()) { setErr("撮影場所（その他）を記入してください"); return; }
    if (!form.eventUrl.trim())    { setErr("イベント事前申請のURLを入力してください"); return; }
    setErr("");
    setShowConfirm(true);
  };

  const confirmSend = () => {
    const totalAmount = form.category==="both"
      ? (Number(form.amountCamera)||0)+(Number(form.amountHairmake)||0)
      : Number(form.amount)||0;
    onSave({ ...form, departments: form.platforms, staffId: req?.staffId||"", status: req?.status||"pending", amount: totalAmount });
  };

  const catLabel = form.category==="camera"?"📷 カメラ":form.category==="hairmake"?"💄 ヘアメイク":"📷💄 両方";
  const locLabel = form.location==="office"?"オフィス（目黒F2ビルディング 1F）":form.locationNote||"その他";
  const pfLabel  = form.platforms.map(id => DEPTS.find(x=>x.id===id)?.label).filter(Boolean).join("、");

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(26,26,53,.45)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:T.card, border:`1px solid ${T.bdr}`, borderRadius:14, width:600, maxHeight:"92vh", overflow:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.18)", padding:26 }}>
        <div style={{ ...rowC, justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:700 }}>
            {showConfirm ? "📋 送信内容の確認" : req?"依頼を編集":"新規依頼を追加"}
          </div>
          <button style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:20, lineHeight:1 }} onClick={onClose}>×</button>
        </div>

        {/* ── 確認画面 ── */}
        {showConfirm && (
          <div>
            <div style={{ background:T.accBg, border:`1px solid ${T.acc}25`, borderRadius:10, padding:"12px 16px", marginBottom:18, fontSize:12, color:T.acc, fontWeight:600 }}>
              以下の内容で業推チームに依頼を送信します。内容をご確認ください。
            </div>
            <div style={{ ...cardS, padding:0, overflow:"hidden", marginBottom:20 }}>
              {[
                ["📅 撮影日",     form.date],
                ["📺 配信PF",     pfLabel||"未選択"],
                ["💄 カテゴリ",   catLabel],
                ["📍 撮影場所",   locLabel],
                form.category==="both"
                  ? ["💴 希望金額", [
                      `📷 カメラ: ${form.amountCamera ? fmtY(Number(form.amountCamera)) : "未入力"}`,
                      `💄 ヘアメイク: ${form.amountHairmake ? fmtY(Number(form.amountHairmake)) : "未入力"}`,
                      `合計: ${fmtY((Number(form.amountCamera)||0)+(Number(form.amountHairmake)||0))}`
                    ].join("　")]
                  : ["💴 希望金額", form.amount ? fmtY(Number(form.amount)) : "未入力"],
                ["📝 撮影内容",   form.content],
                ["🙋 依頼者",     form.requester + (form.requesterSlackId ? `　@${form.requesterSlackId}` : "")],
                ["📋 香盤表",     form.komban || "後から提出"],
                ["📄 コンポジ",   form.compo  || "後から提出"],
                ["💬 備考",       form.note   || "なし"],
                ["🔗 Slackスレッド", form.slackThreadUrl || "未登録"],
                ["📎 事前申請",       form.eventUrl || "なし"],
              ].map(([label, value], i) => (
                <div key={label} style={{ display:"grid", gridTemplateColumns:"110px 1fr", gap:0,
                  borderTop: i>0?`1px solid ${T.bdr}`:"none",
                  background: i%2===0 ? T.card : T.bg }}>
                  <div style={{ padding:"11px 14px", fontSize:11, fontWeight:600, color:T.muted, borderRight:`1px solid ${T.bdr}` }}>{label}</div>
                  <div style={{ padding:"11px 14px", fontSize:13, color:T.text, whiteSpace:"pre-wrap", wordBreak:"break-all" }}>{value}</div>
                </div>
              ))}
            </div>
            {((!form.komban)||(!form.compo)) && (
              <div style={{ background:T.warnBg, border:`1px solid ${T.warn}30`, borderRadius:8, padding:"10px 14px", marginBottom:18, fontSize:11, color:T.warn }}>
                📌 香盤表・コンポジが未入力です。後からSlackの依頼スレッドにて提出をお願いします。
              </div>
            )}
            <div style={{ ...rowC, justifyContent:"flex-end", gap:10, paddingTop:16, borderTop:`1px solid ${T.bdr}` }}>
              <Btn v="ghost" onClick={() => setShowConfirm(false)}>← 修正する</Btn>
              <Btn v="ok" onClick={confirmSend}>✅ この内容で送信する</Btn>
            </div>
          </div>
        )}

        {/* ── 入力フォーム ── */}
        {!showConfirm && <>

        {err && <div style={{ background:T.ngBg, border:`1px solid ${T.ng}30`, borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12, color:T.ng, fontWeight:500 }}>⚠ {err}</div>}

        {/* 撮影日 */}
        <div style={frow}>
          <label style={lbl}>📅 撮影日 <span style={{ color:T.ng }}>*</span></label>
          <input type="date" value={form.date} onChange={e => { set("date", e.target.value); setErr(""); }} style={inp} />
        </div>

        {/* 配信プラットフォーム */}
        <div style={frow}>
          <label style={lbl}>📺 配信プラットフォーム <span style={{ color:T.ng }}>*</span>
            {form.platforms.length>1 && <span style={{ color:T.warn, marginLeft:8, textTransform:"none", fontSize:10, fontWeight:500 }}>👥 合同撮影</span>}
          </label>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {DEPTS.map(d => {
              const on = form.platforms.includes(d.id);
              return (
                <label key={d.id} style={{ ...rowC, gap:10, cursor:"pointer", padding:"11px 14px", borderRadius:9,
                  background:on?`${d.color}10`:T.bg, border:`1px solid ${on?d.color+"60":T.bdr}`, transition:"all .12s" }}>
                  <input type="checkbox" checked={on} onChange={() => { toggleP(d.id); setErr(""); }} style={{ accentColor:d.color, width:16, height:16, flexShrink:0 }} />
                  <div style={{ fontSize:13, fontWeight:on?700:500, color:on?d.color:T.text }}>{d.label}</div>
                </label>
              );
            })}
          </div>
          {form.platforms.length>1 && form.category!=="both" && Number(form.amount)>0 && (
            <div style={{ marginTop:8, background:T.accBg, borderRadius:7, padding:"8px 12px", border:`1px solid ${T.acc}25` }}>
              <div style={{ fontSize:10, color:T.muted, marginBottom:5, fontWeight:600 }}>按分プレビュー（均等）</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {form.platforms.map(id => { const d=DEPTS.find(x=>x.id===id); return d?<Tag key={id} color={d.color}>{d.name}: {fmtY(share)}</Tag>:null; })}
              </div>
            </div>
          )}
        </div>

        {/* カテゴリ */}
        <div style={frow}>
          <label style={lbl}>💄 依頼カテゴリ <span style={{ color:T.ng }}>*</span></label>
          <div style={{ display:"flex", gap:8 }}>
            {[["camera","📷 カメラ"],["hairmake","💄 ヘアメイク"],["both","📷💄 両方"]].map(([v,l]) => {
              const on = form.category===v;
              return (
                <label key={v} style={{ ...rowC, gap:8, cursor:"pointer", flex:1, padding:"11px 14px", borderRadius:9,
                  background:on?T.accBg:T.bg, border:`1px solid ${on?T.acc+"60":T.bdr}`, transition:"all .12s" }}>
                  <input type="radio" name="cat" value={v} checked={on} onChange={() => set("category",v)} style={{ accentColor:T.acc, width:16, height:16 }} />
                  <span style={{ fontSize:13, fontWeight:on?700:500, color:on?T.acc:T.text }}>{l}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 希望金額 */}
        {form.category!=="both" && (
          <div style={frow}>
            <label style={lbl}>💴 希望金額（円） <span style={{ color:T.ng }}>*</span></label>
            <input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="例：50000" style={inp} />
            {form.platforms.length>1 && Number(form.amount)>0 && (
              <div style={{ marginTop:8, background:T.accBg, borderRadius:7, padding:"8px 12px", border:`1px solid ${T.acc}25` }}>
                <div style={{ fontSize:10, color:T.muted, marginBottom:5, fontWeight:600 }}>按分プレビュー（均等）</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {form.platforms.map(id => { const d=DEPTS.find(x=>x.id===id); return d?<Tag key={id} color={d.color}>{d.name}: {fmtY(share)}</Tag>:null; })}
                </div>
              </div>
            )}
          </div>
        )}
        {form.category==="both" && (
          <div style={frow}>
            <label style={lbl}>💴 希望金額（円） <span style={{ color:T.ng }}>*</span></label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <div style={{ fontSize:11, color:T.muted, marginBottom:5, fontWeight:600 }}>📷 カメラマン</div>
                <input type="number" value={form.amountCamera||""} onChange={e => set("amountCamera", e.target.value)} placeholder="例：50000" style={inp} />
                {form.platforms.length>1 && Number(form.amountCamera)>0 && (
                  <div style={{ marginTop:5, fontSize:10, color:T.muted }}>
                    按分: {form.platforms.map(id => { const d=DEPTS.find(x=>x.id===id); return d?`${d.name} ${fmtY(Math.round(Number(form.amountCamera)/form.platforms.length))}`:null; }).filter(Boolean).join(" / ")}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize:11, color:T.muted, marginBottom:5, fontWeight:600 }}>💄 ヘアメイク</div>
                <input type="number" value={form.amountHairmake||""} onChange={e => set("amountHairmake", e.target.value)} placeholder="例：40000" style={inp} />
                {form.platforms.length>1 && Number(form.amountHairmake)>0 && (
                  <div style={{ marginTop:5, fontSize:10, color:T.muted }}>
                    按分: {form.platforms.map(id => { const d=DEPTS.find(x=>x.id===id); return d?`${d.name} ${fmtY(Math.round(Number(form.amountHairmake)/form.platforms.length))}`:null; }).filter(Boolean).join(" / ")}
                  </div>
                )}
              </div>
            </div>
            {(Number(form.amountCamera)||0)+(Number(form.amountHairmake)||0)>0 && (
              <div style={{ marginTop:8, padding:"8px 12px", background:T.accBg, borderRadius:7, border:`1px solid ${T.acc}25`, fontSize:12, color:T.acc, fontWeight:600 }}>
                合計: {fmtY((Number(form.amountCamera)||0)+(Number(form.amountHairmake)||0))}
              </div>
            )}
          </div>
        )}

        {/* 撮影場所 */}
        <div style={frow}>
          <label style={lbl}>📍 撮影場所 <span style={{ color:T.ng }}>*</span></label>
          <div style={{ display:"flex", gap:8, marginBottom:form.location==="office"?6:0 }}>
            {LOCATIONS.map(loc => {
              const on = form.location===loc.id;
              return (
                <label key={loc.id} style={{ ...rowC, gap:8, cursor:"pointer", flex:1, padding:"11px 14px", borderRadius:9,
                  background:on?T.accBg:T.bg, border:`1px solid ${on?T.acc+"60":T.bdr}`, transition:"all .12s" }}>
                  <input type="radio" name="loc" value={loc.id} checked={on} onChange={() => set("location",loc.id)} style={{ accentColor:T.acc, width:16, height:16 }} />
                  <span style={{ fontSize:13, fontWeight:on?700:500, color:on?T.acc:T.text }}>{loc.name}</span>
                </label>
              );
            })}
          </div>
          {form.location==="office" && (
            <div style={{ fontSize:11, color:T.muted, padding:"6px 10px", background:T.bg, borderRadius:6, border:`1px solid ${T.bdr}` }}>
              📌 〒153-0061 東京都目黒区中目黒1－8－8　目黒F2ビルディング 1F
            </div>
          )}
          {form.location==="other" && (
            <input value={form.locationNote} onChange={e => { set("locationNote", e.target.value); setErr(""); }}
              placeholder="撮影場所を記入してください" style={{ ...inp, marginTop:8 }} />
          )}
        </div>

        {/* 撮影内容 */}
        <div style={frow}>
          <label style={lbl}>📝 撮影内容 <span style={{ color:T.ng }}>*</span></label>
          <textarea value={form.content} onChange={e => { set("content", e.target.value); setErr(""); }} rows={2}
            placeholder="例：ライバープロフィール用撮影" style={{ ...inp, resize:"vertical" }} />
        </div>

        {/* 依頼者 */}
        <div style={frow}>
          <label style={lbl}>🙋 依頼者 <span style={{ color:T.ng }}>*</span></label>
          <select value={form.requesterEmpId||""} onChange={e => {
            const emp = employees.find(x => x.id===e.target.value);
            set("requesterEmpId", e.target.value);
            set("requester", emp?.name||"");
            set("requesterSlackId", emp?.slackId||"");
            setErr("");
          }} style={inp}>
            <option value="">── 依頼者を選択してください ──</option>
            {(employees||[]).map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          {form.requester && (
            <div style={{ marginTop:5, fontSize:11, color:T.ok }}>
              ✅ {form.requester}　Slack: <code style={{ background:T.bg, padding:"1px 5px", borderRadius:3 }}>@{form.requesterSlackId||"未登録"}</code>
            </div>
          )}
        </div>

        {/* 香盤表 */}
        <div style={frow}>
          <label style={lbl}>📋 香盤表</label>
          <textarea value={form.komban} onChange={e => set("komban", e.target.value)} rows={2}
            placeholder="香盤表の内容を記載してください（後から記入も可）" style={{ ...inp, resize:"vertical" }} />
          {!form.komban && <div style={{ marginTop:6, fontSize:11, color:T.warn, padding:"5px 9px", background:T.warnBg, borderRadius:5, border:`1px solid ${T.warn}20` }}>📌 後から提出の場合はSlackの依頼スレッドにて提出をお願いします</div>}
        </div>

        {/* コンポジ */}
        <div style={frow}>
          <label style={lbl}>📄 コンポジ</label>
          <textarea value={form.compo} onChange={e => set("compo", e.target.value)} rows={2}
            placeholder="コンポジの内容を記載してください（後から記入も可）" style={{ ...inp, resize:"vertical" }} />
          {!form.compo && <div style={{ marginTop:6, fontSize:11, color:T.warn, padding:"5px 9px", background:T.warnBg, borderRadius:5, border:`1px solid ${T.warn}20` }}>📌 後から提出の場合はSlackの依頼スレッドにて提出をお願いします</div>}
        </div>

        {/* 備考 */}
        <div style={frow}>
          <label style={lbl}>💬 備考</label>
          <textarea value={form.note} onChange={e => set("note", e.target.value)} rows={2}
            placeholder="その他連絡事項があれば記載してください" style={{ ...inp, resize:"vertical" }} />
        </div>

        {/* SlackスレッドURL */}
        <div style={frow}>
          <label style={lbl}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
              💬 Slackスレッド URL
              <span style={{ fontSize:9, background:T.warnBg, color:"#B45309", border:"1px solid #B4530930", borderRadius:3, padding:"1px 5px", fontWeight:500, textTransform:"none" }}>業推のみ</span>
            </span>
          </label>
          <div style={{ position:"relative" }}>
            <input value={form.slackThreadUrl} onChange={e => set("slackThreadUrl", e.target.value)}
              placeholder="https://app.slack.com/..." style={{ ...inp, paddingRight:80 }} />
            {form.slackThreadUrl && (
              <a href={form.slackThreadUrl} target="_blank" rel="noopener noreferrer"
                style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"#5B5FEE", fontWeight:600, textDecoration:"none", background:"#EEEFFE", padding:"3px 8px", borderRadius:4, border:"1px solid #5B5FEE30" }}>
                開く
              </a>
            )}
          </div>
          <div style={{ fontSize:10, color:"#9595B5", marginTop:4 }}>依頼通知が届いたSlackスレッドのURLを貼り付けてください。確定時の自動投稿に使用します。</div>
        </div>

        {/* イベント事前申請 */}
        <div style={frow}>
          <label style={lbl}>📎 イベント事前申請 <span style={{ color:T.ng }}>*</span></label>
          <div style={{ position:"relative" }}>
            <input value={form.eventUrl} onChange={e => set("eventUrl", e.target.value)}
              placeholder="申請書URL・リンクを貼り付けてください" style={{ ...inp, paddingRight:60 }} />
            {form.eventUrl && (
              <a href={form.eventUrl} target="_blank" rel="noopener noreferrer"
                style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)",
                  fontSize:11, color:T.acc, fontWeight:600, textDecoration:"none",
                  background:T.accBg, padding:"3px 8px", borderRadius:4, border:`1px solid ${T.acc}30` }}>
                開く
              </a>
            )}
          </div>
        </div>

        <div style={{ ...rowC, justifyContent:"flex-end", gap:10, paddingTop:16, borderTop:`1px solid ${T.bdr}` }}>
          <Btn v="ghost" onClick={onClose}>キャンセル</Btn>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
            {!canSubmit && <div style={{ fontSize:11, color:T.muted }}>※ 必須項目（<span style={{ color:T.ng }}>*</span>）をすべて入力してください</div>}
            <Btn onClick={submit} disabled={!canSubmit}>{req?"更新する":"内容を確認する →"}</Btn>
          </div>
        </div>

        </>}
      </div>
    </div>
  );
}
