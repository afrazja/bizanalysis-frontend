import React, { useState } from 'react';
import { postSWOT, createSnapshot, type SWOTIn } from '../lib/api';

function TextAreaList({ label, value, setValue }: { label: string; value: string; setValue: (v:string)=>void }){
  return (
    <div>
      <label className="small">{label} (one per line)</label>
      <textarea className="btn" rows={5} value={value} onChange={e=>setValue(e.target.value)} style={{ width:'100%' }} />
    </div>
  );
}

export default function SwotEditor(){
  const [s, setS] = useState('Strong brand\nLow cost base');
  const [w, setW] = useState('Churn in SMB');
  const [o, setO] = useState('APAC demand growing');
  const [t, setT] = useState('Platform policy risk');
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const toList = (txt:string) => txt.split(/\n+/).map(x=>x.trim()).filter(Boolean);

  const build = (): SWOTIn => ({
    strengths: toList(s),
    weaknesses: toList(w),
    opportunities: toList(o),
    threats: toList(t),
  });

  const generate = async () => {
    setBusy(true);
    try { await postSWOT(build()); } finally { setBusy(false); }
  };

  const saveSnapshot = async () => {
    setBusy(true);
    try {
      const body = build();
      const snap = await createSnapshot({ kind:'SWOT', payload: body, note:'demo' });
      setSavedId(snap.id);
    } finally { setBusy(false); }
  };

  return (
    <div className="card">
      <h3 style={{ marginTop:0 }}>SWOT Editor</h3>
      <div className="grid">
        <TextAreaList label="Strengths" value={s} setValue={setS} />
        <TextAreaList label="Weaknesses" value={w} setValue={setW} />
        <TextAreaList label="Opportunities" value={o} setValue={setO} />
        <TextAreaList label="Threats" value={t} setValue={setT} />
      </div>
      <div style={{ display:'flex', gap:8, marginTop:12 }}>
        <button className="btn" onClick={generate} disabled={busy}>{busy? 'Working…':'Preview /swot'}</button>
        <button className="btn" onClick={saveSnapshot} disabled={busy}>{busy? 'Saving…':'Save SWOT Snapshot'}</button>
        {savedId && <span className="small">Saved ✓ ID: {savedId.slice(0,8)}</span>}
      </div>
      <div className="small" style={{ marginTop:8 }}>Tip: paste bullets; one per line.</div>
    </div>
  );
}
