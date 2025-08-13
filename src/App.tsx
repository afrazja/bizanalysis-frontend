import React, { useEffect, useRef, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { postBCG, type ProductIn, type BCGPoint, getHealth, createSnapshot, listSnapshots, type SnapshotOut } from './lib/api';

const sample: ProductIn[] = [
  { name: 'Alpha', market_share: 0.30, largest_rival_share: 0.25, market_growth_rate: 14 },
  { name: 'Beta',  market_share: 0.18, largest_rival_share: 0.35, market_growth_rate: 12 },
  { name: 'Gamma', market_share: 0.42, largest_rival_share: 0.28, market_growth_rate: 6 },
  { name: 'Delta', market_share: 0.12, largest_rival_share: 0.30, market_growth_rate: 4 },
];

function downloadJSON(obj: any, filename = 'snapshot.json') {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App(){
  const [data, setData] = useState<BCGPoint[]>([]);
  const [apiOk, setApiOk] = useState<string>('not checked');
  const [saving, setSaving] = useState(false);
  const [loadingSnaps, setLoadingSnaps] = useState(false);
  const [snaps, setSnaps] = useState<SnapshotOut[]>([]);

  const run = async () => {
    const res = await postBCG(sample);
    setData(res);
  };

  const check = async () => {
    try {
      const h = await getHealth();
      setApiOk(JSON.stringify(h));
    } catch (e) {
      setApiOk('error');
    }
  }

  const saveSnapshot = async () => {
    if (!data || data.length === 0) {
      alert('Run BCG first to generate points.');
      return;
    }
    setSaving(true);
    try {
      await createSnapshot({ kind: 'BCG', payload: { points: data }, note: 'demo' });
      await loadSnapshots();
    } finally {
      setSaving(false);
    }
  };

  const loadSnapshots = async () => {
    setLoadingSnaps(true);
    try {
      const rows = await listSnapshots({ kind: 'BCG', limit: 20 });
      setSnaps(rows);
    } finally {
      setLoadingSnaps(false);
    }
  };

  useEffect(() => {
    // Preflight health and initial snapshot list
    check();
    loadSnapshots();
  }, []);

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Biz Analysis (MVP)</h2>
        <div className="small">API Base: <span className="badge">{import.meta.env.VITE_API_BASE_URL || 'NOT SET'}</span></div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Health Check</h3>
          <button className="btn" onClick={check}>GET /health</button>
          <div className="small" style={{ marginTop: 8 }}>Response: {apiOk}</div>
        </div>

        <div className="card">
          <h3>BCG Matrix (sample)</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button className="btn" onClick={run}>POST /bcg</button>
            <button className="btn" onClick={saveSnapshot} disabled={saving || data.length === 0}>
              {saving ? 'Saving…' : 'Save Snapshot'}
            </button>
          </div>
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <ScatterChart width={700} height={350}>
              <CartesianGrid />
              <XAxis type="number" dataKey="rms" name="RMS" domain={[0, 'auto']} />
              <YAxis type="number" dataKey="growth" name="Growth %" domain={[0, 'auto']} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <ReferenceLine x={1} strokeDasharray="3 3" />
              <ReferenceLine y={10} strokeDasharray="3 3" />
              <Scatter data={data} name="Products" />
            </ScatterChart>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Snapshots (latest 20)</h3>
          <div>
            <button className="btn" onClick={loadSnapshots} disabled={loadingSnaps}>
              {loadingSnaps ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
        <div style={{ marginTop: 12, overflowX: 'auto' }}>
          {snaps.length === 0 ? (
            <div className="small">No snapshots yet. Generate BCG and click "Save Snapshot".</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Created</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Kind</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Points</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {snaps.map((s) => {
                  const count = Array.isArray(s.payload?.points) ? s.payload.points.length : 0;
                  const shortId = s.id.slice(0, 8);
                  const when = new Date(s.created_at).toLocaleString();
                  return (
                    <tr key={s.id} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: '6px 8px' }}>{when}</td>
                      <td style={{ padding: '6px 8px' }}>{s.kind}</td>
                      <td style={{ padding: '6px 8px' }}>{count}</td>
                      <td style={{ padding: '6px 8px' }}>{shortId}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <button className="btn" onClick={() => downloadJSON(s, `snapshot-${shortId}.json`)}>Download</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
