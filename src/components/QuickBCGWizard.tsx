import React, { useState } from 'react';
import type { BCGPoint } from '../lib/api';
import { postBCG } from '../lib/api';

export default function QuickBCGWizard({ onResult }: { onResult: (points: BCGPoint[]) => void }){
  const [name, setName] = useState('New Product');
  const [growth, setGrowth] = useState('12'); // percent
  const [share, setShare] = useState('20');   // percent
  const [rival, setRival] = useState('25');   // percent
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const market_growth_rate = parseFloat(growth);
    const market_share = parseFloat(share) / 100.0;
    const largest_rival_share = parseFloat(rival) / 100.0;
    if ([market_growth_rate, market_share, largest_rival_share].some(x => Number.isNaN(x))) return alert('Enter valid numbers');
    setBusy(true);
    try {
      const points = await postBCG([{ name, market_growth_rate, market_share, largest_rival_share }]);
      onResult(points);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
      <div>
        <label className="small">Product Name</label>
        <input className="btn" value={name} onChange={e=>setName(e.target.value)} />
      </div>
      <div>
        <label className="small">Market Growth %</label>
        <input className="btn" value={growth} onChange={e=>setGrowth(e.target.value)} />
      </div>
      <div>
        <label className="small">Your Market Share %</label>
        <input className="btn" value={share} onChange={e=>setShare(e.target.value)} />
      </div>
      <div>
        <label className="small">Largest Rival Share %</label>
        <input className="btn" value={rival} onChange={e=>setRival(e.target.value)} />
      </div>
      <div style={{ alignSelf: 'end' }}>
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Calculating…' : 'Generate BCG'}</button>
      </div>
    </form>
  );
}
