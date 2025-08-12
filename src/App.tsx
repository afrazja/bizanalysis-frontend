import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { postBCG, type ProductIn, type BCGPoint, getHealth } from './lib/api';

const sample: ProductIn[] = [
  { name: 'Alpha', market_share: 0.30, largest_rival_share: 0.25, market_growth_rate: 14 },
  { name: 'Beta',  market_share: 0.18, largest_rival_share: 0.35, market_growth_rate: 12 },
  { name: 'Gamma', market_share: 0.42, largest_rival_share: 0.28, market_growth_rate: 6 },
  { name: 'Delta', market_share: 0.12, largest_rival_share: 0.30, market_growth_rate: 4 },
];

export default function App(){
  const [data, setData] = useState<BCGPoint[]>([]);
  const [apiOk, setApiOk] = useState<string>('not checked');

  const run = async () => {
    const res = await postBCG(sample);
    setData(res);
  };

  const check = async () => {
    const h = await getHealth();
    setApiOk(JSON.stringify(h));
  }

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
          <button className="btn" onClick={run}>POST /bcg</button>
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
    </div>
  );
}
