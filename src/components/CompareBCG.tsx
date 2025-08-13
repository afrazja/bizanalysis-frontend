import React, { useEffect, useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from 'recharts';
import { listSnapshots, getSnapshot, type SnapshotOut, type BCGPoint } from '../lib/api';

function quadrantOf(p: { rms: number; growth: number }){
  const growthThreshold = 10; // %
  const rmsThreshold = 1;
  if (p.growth >= growthThreshold && p.rms >= rmsThreshold) return 'Star';
  if (p.growth < growthThreshold && p.rms >= rmsThreshold) return 'Cash Cow';
  if (p.growth >= growthThreshold && p.rms < rmsThreshold) return 'Question Mark';
  return 'Dog';
}

export default function CompareBCG(){
  const [options, setOptions] = useState<SnapshotOut[]>([]);
  const [fromId, setFromId] = useState<string>('');
  const [toId, setToId] = useState<string>('');
  const [fromSnap, setFromSnap] = useState<SnapshotOut | null>(null);
  const [toSnap, setToSnap] = useState<SnapshotOut | null>(null);
  const [loading, setLoading] = useState(false);

  // Load latest BCG snapshots for dropdowns
  useEffect(() => {
    (async () => {
      const rows = await listSnapshots({ kind: 'BCG', limit: 50 });
      setOptions(rows);
    })();
  }, []);

  // Fetch selected snapshots
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (fromId) setFromSnap(await getSnapshot(fromId)); else setFromSnap(null);
        if (toId) setToSnap(await getSnapshot(toId)); else setToSnap(null);
      } finally { setLoading(false); }
    })();
  }, [fromId, toId]);

  const fromPts: BCGPoint[] = useMemo(() => (fromSnap?.payload?.points ?? []) as BCGPoint[], [fromSnap]);
  const toPts: BCGPoint[] = useMemo(() => (toSnap?.payload?.points ?? []) as BCGPoint[], [toSnap]);

  const diffs = useMemo(() => {
    const map = new Map(fromPts.map(p => [p.name, p]));
    return toPts.map(np => {
      const op = map.get(np.name);
      if (!op) return { name: np.name, from: null as any, to: np, drms: null, dgrowth: null, qFrom: null, qTo: quadrantOf(np) };
      const drms = np.rms - op.rms;
      const dgrowth = np.growth - op.growth;
      return { name: np.name, from: op, to: np, drms, dgrowth, qFrom: quadrantOf(op), qTo: quadrantOf(np) };
    });
  }, [fromPts, toPts]);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>Compare BCG Snapshots</h3>
      <div className="grid" style={{ alignItems: 'end' }}>
        <div>
          <label className="small">From snapshot</label>
          <select className="btn" value={fromId} onChange={e=>setFromId(e.target.value)}>
            <option value="">(Select)</option>
            {options.map(o => <option key={o.id} value={o.id}>{new Date(o.created_at).toLocaleString()} — {o.id.slice(0,8)}</option>)}
          </select>
        </div>
        <div>
          <label className="small">To snapshot</label>
          <select className="btn" value={toId} onChange={e=>setToId(e.target.value)}>
            <option value="">(Select)</option>
            {options.map(o => <option key={o.id} value={o.id}>{new Date(o.created_at).toLocaleString()} — {o.id.slice(0,8)}</option>)}
          </select>
        </div>
        <div className="small">{loading ? 'Loading…' : ''}</div>
      </div>

      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <ScatterChart width={700} height={350}>
          <CartesianGrid />
          <XAxis type="number" dataKey="rms" name="RMS" domain={[0, 'auto']} />
          <YAxis type="number" dataKey="growth" name="Growth %" domain={[0, 'auto']} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <ReferenceLine x={1} strokeDasharray="3 3" />
          <ReferenceLine y={10} strokeDasharray="3 3" />
          {/* Overlay: from = triangle, to = circle */}
          <Scatter data={fromPts} name="From" shape="triangle" />
          <Scatter data={toPts} name="To" shape="circle" />
          <Legend />
        </ScatterChart>
      </div>

      <div style={{ marginTop: 12, overflowX: 'auto' }}>
        <table style={{ width:'100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left', padding:'6px 8px' }}>Product</th>
              <th style={{ textAlign:'left', padding:'6px 8px' }}>RMS Δ</th>
              <th style={{ textAlign:'left', padding:'6px 8px' }}>Growth Δ (pp)</th>
              <th style={{ textAlign:'left', padding:'6px 8px' }}>Quadrant</th>
            </tr>
          </thead>
          <tbody>
            {diffs.map(d => {
              const fmt = (n: number | null) => n == null ? '—' : (n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2));
              const q = (d.qFrom && d.qTo) ? `${d.qFrom} → ${d.qTo}` : (d.qTo || '—');
              const changed = d.qFrom && d.qTo && d.qFrom !== d.qTo;
              return (
                <tr key={d.name} style={{ borderTop: '1px solid #eee', background: changed ? '#f0f9ff' : undefined }}>
                  <td style={{ padding:'6px 8px' }}>{d.name}</td>
                  <td style={{ padding:'6px 8px' }}>{fmt(d.drms)}</td>
                  <td style={{ padding:'6px 8px' }}>{fmt(d.dgrowth)}</td>
                  <td style={{ padding:'6px 8px' }}>{q}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="small" style={{ marginTop: 8 }}>Tip: Select two recent snapshots of kind BCG. Rows highlighted when the product changed quadrant.</div>
      </div>
    </div>
  );
}
