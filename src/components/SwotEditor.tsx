import React, { useImperativeHandle, useState, forwardRef } from 'react';
import { postSWOT, createSnapshot, suggestSWOT, type SWOTIn, type SuggestSWOTIn, type BCGPoint } from '../lib/api';

function TextAreaList({ label, value, setValue }: { label: string; value: string; setValue: (v:string)=>void }){
  return (
    <div>
      <label className="small">{label} (one per line)</label>
      <textarea className="btn" rows={5} value={value} onChange={e=>setValue(e.target.value)} style={{ width:'100%' }} />
    </div>
  );
}

export type SwotRef = { get: () => SWOTIn };
export type SwotEditorProps = {
  bcgPoints?: BCGPoint[];
  companyName?: string;
  industry?: string;
};

const SwotEditor = forwardRef<SwotRef, SwotEditorProps>(function SwotEditor(props, ref){
  const [s, setS] = useState('Strong brand\nLow cost base');
  const [w, setW] = useState('Churn in SMB');
  const [o, setO] = useState('APAC demand growing');
  const [t, setT] = useState('Platform policy risk');
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const toList = (txt:string) => txt.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const fromList = (items: string[]) => items.join('\n');
  const build = (): SWOTIn => ({
    strengths: toList(s), weaknesses: toList(w), opportunities: toList(o), threats: toList(t)
  });

  useImperativeHandle(ref, () => ({ get: build }));

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

  const suggestSwot = async () => {
    setBusy(true);
    try {
      const body: SuggestSWOTIn = {
        company: props.companyName,
        industry: props.industry,
        points: props.bcgPoints || [],
        // Extract market/product data from BCG points if available
        markets: props.bcgPoints?.map(p => ({ name: p.name, growth_rate: p.growth })) || [],
        products: props.bcgPoints?.map(p => ({ 
          name: p.name, 
          market_share: p.rms, 
          largest_rival_share: Math.max(p.rms * 0.8, 0.1) // rough estimate
        })) || []
      };
      
      const suggested = await suggestSWOT(body);
      
      // Merge suggestions with existing content, avoiding duplicates
      const mergeUnique = (existing: string, suggestions: string[]) => {
        const existingItems = toList(existing);
        const newItems = suggestions.filter(item => 
          !existingItems.some(existing => 
            existing.toLowerCase().includes(item.toLowerCase()) || 
            item.toLowerCase().includes(existing.toLowerCase())
          )
        );
        return fromList([...existingItems, ...newItems]);
      };
      
      setS(mergeUnique(s, suggested.strengths));
      setW(mergeUnique(w, suggested.weaknesses));
      setO(mergeUnique(o, suggested.opportunities));
      setT(mergeUnique(t, suggested.threats));
      
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
        <button className="btn secondary" onClick={suggestSwot} disabled={busy}>
          💡 {busy? 'Suggesting…':'Suggest SWOT'}
        </button>
        {savedId && <span className="small">Saved ✓ ID: {savedId.slice(0,8)}</span>}
      </div>
      <div className="small" style={{ marginTop:8 }}>Tip: paste bullets; one per line. Use "Suggest SWOT" for AI-powered ideas based on your BCG analysis.</div>
    </div>
  );
});

export default SwotEditor;
