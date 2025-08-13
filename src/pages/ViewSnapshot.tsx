import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSnapshot, type SnapshotOut, type BCGPoint } from '../lib/api';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from 'recharts';

export default function ViewSnapshot(){
  const { id } = useParams();
  const [snap, setSnap] = useState<SnapshotOut | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try { if (id) setSnap(await getSnapshot(id)); } catch (e: any){ setErr(e?.message || 'Failed to load'); }
    })();
  }, [id]);

  if (err) return <div className="container"><div className="card">Error: {err}</div></div>;
  if (!snap) return <div className="container"><div className="card">Loading…</div></div>;

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Snapshot — {snap.kind}</h2>
        <div className="small">ID: {snap.id.slice(0,8)} • {new Date(snap.created_at).toLocaleString()}</div>
      </div>

      {snap.kind === 'BCG' && Array.isArray((snap.payload as any)?.points) ? (
        <div className="card">
          <h3>BCG Matrix</h3>
          <div id="bcg-chart-view" style={{ overflowX:'auto', marginTop:12, padding:8, background:'#fff' }}>
            <ScatterChart width={700} height={350}>
              <CartesianGrid />
              <XAxis type="number" dataKey="rms" name="RMS" domain={[0, 'auto']} />
              <YAxis type="number" dataKey="growth" name="Growth %" domain={[0, 'auto']} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <ReferenceLine x={1} strokeDasharray="3 3" />
              <ReferenceLine y={10} strokeDasharray="3 3" />
              <Scatter data={(snap.payload as any).points as BCGPoint[]} name="Products" />
              <Legend />
            </ScatterChart>
          </div>
        </div>
      ) : snap.kind === 'SWOT' ? (
        <div className="card">
          <h3>SWOT</h3>
          <div className="grid">
            {(['strengths','weaknesses','opportunities','threats'] as const).map(k => (
              <div key={k}>
                <div className="small" style={{ fontWeight: 600, marginBottom: 6 }}>{k[0].toUpperCase()+k.slice(1)}</div>
                <ul style={{ margin:0, paddingLeft: 18 }}>
                  {Array.isArray((snap.payload as any)?.[k]) && (snap.payload as any)[k].length > 0 ?
                    (snap.payload as any)[k].map((it: string, i: number) => <li key={i}>{it}</li>) : <li>—</li>}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">Unsupported snapshot kind: {snap.kind}</div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="small">Read‑only share view. For edits, return to the main app.</div>
      </div>
    </div>
  );
}
