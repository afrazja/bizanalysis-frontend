import React, { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { bulkMarkets, bulkProducts, listAllMarkets, type MarketIn, type ProductCreate } from '../lib/api';
import { postBCG, type BCGPoint } from '../lib/api';

// Expected headers (lowercase, trimmed):
// product_name, market_name, market_growth_rate, market_share_percent, largest_rival_share_percent

type Row = {
  product_name: string;
  market_name: string;
  market_growth_rate: number; // %
  market_share_percent: number; // %
  largest_rival_share_percent: number; // %
};

function toCsv(arr: string[][]){
  return arr.map(r => r.map(c => '"' + (c ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
}

function downloadTemplate(){
  const headers = ['product_name','market_name','market_growth_rate','market_share_percent','largest_rival_share_percent'];
  const sample1 = ['Alpha','US SMB HR','14','30','25'];
  const sample2 = ['Beta','US SMB HR','14','18','35'];
  const csv = toCsv([headers, sample1, sample2]);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = 'bcg_import_template.csv'; a.click(); URL.revokeObjectURL(url);
}

export default function CsvImportBCG({ onComputed }: { onComputed: (points: BCGPoint[]) => void }){
  const [rows, setRows] = useState<Row[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const hasRows = rows.length > 0;

  const handleFile = (file: File) => {
    setParsingError(null); setResultMsg(null);
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.toLowerCase().trim(),
      complete: (res: any) => {
        const data = (res.data || []).map((r: any) => ({
          product_name: String(r.product_name || '').trim(),
          market_name: String(r.market_name || '').trim(),
          market_growth_rate: Number(r.market_growth_rate),
          market_share_percent: Number(r.market_share_percent),
          largest_rival_share_percent: Number(r.largest_rival_share_percent),
        }));
        // Validate
        const bad = data.find((r: any) => !r.product_name || !r.market_name || Number.isNaN(r.market_growth_rate) || Number.isNaN(r.market_share_percent) || Number.isNaN(r.largest_rival_share_percent));
        if (bad){ setParsingError('Invalid or missing values detected. Ensure headers match the template.'); setRows([]); return; }
        setRows(data);
      },
      error: (err: any) => setParsingError('Parse error: ' + err.message)
    });
  };

  const createEntitiesAndCompute = async () => {
    if (!hasRows) return;
    setBusy(true); setResultMsg(null); setParsingError(null);
    try {
      console.log('Starting CSV import with rows:', rows.length);
      console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
      
      let marketsCreated = 0;
      let productsCreated = 0;
      
      // Try to create database entities, but don't fail if database is unavailable
      try {
        // 1) Create unique markets (by name)
        const marketMap = new Map<string, MarketIn>();
        for (const r of rows){
          if (!marketMap.has(r.market_name)){
            marketMap.set(r.market_name, { name: r.market_name, growth_rate: r.market_growth_rate });
          }
        }
        console.log('Creating markets:', Array.from(marketMap.values()));
        const createdMkts = await bulkMarkets(Array.from(marketMap.values()));
        console.log('Created markets:', createdMkts);
        marketsCreated = createdMkts.length;
        
        const nameToId = new Map<string, string>();
        createdMkts.forEach(m => nameToId.set(m.name, m.id));

        // 2) Create products
        const products: ProductCreate[] = rows.map(r => ({
          name: r.product_name,
          market_id: nameToId.get(r.market_name) ?? undefined,
          market_share: r.market_share_percent / 100,
          largest_rival_share: r.largest_rival_share_percent / 100,
        }));
        console.log('Creating products:', products);
        await bulkProducts(products);
        console.log('Products created successfully');
        productsCreated = products.length;
      } catch (dbError) {
        console.warn('Database operations failed, proceeding with BCG computation only:', dbError);
      }

      // 3) Compute BCG points directly for the chart (this should always work)
      const bcgInput = rows.map(r => ({
        name: r.product_name,
        market_share: r.market_share_percent / 100,
        largest_rival_share: r.largest_rival_share_percent / 100,
        market_growth_rate: r.market_growth_rate,
      }));
      console.log('Computing BCG with input:', bcgInput);
      const pts = await postBCG(bcgInput);
      console.log('BCG computed:', pts);
      
      onComputed(pts);
      console.log('Called onComputed with points');
      
      if (marketsCreated > 0 || productsCreated > 0) {
        setResultMsg(`Imported ${marketsCreated} market(s) and ${productsCreated} product(s). BCG computed with ${pts.length} points.`);
      } else {
        setResultMsg(`BCG computed with ${pts.length} points. (Database unavailable - entities not persisted)`);
      }
    } catch (error) {
      console.error('CSV import error:', error);
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      setParsingError(`Import failed: ${errorMessage}. Check console for details.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>CSV Import — Markets & Products → BCG</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="file" accept=".csv" onChange={e => e.target.files && e.target.files[0] && handleFile(e.target.files[0])} />
        <button className="btn" onClick={downloadTemplate}>Download Template</button>
        <button className="btn" disabled={!hasRows || busy} onClick={createEntitiesAndCompute}>{busy ? 'Computing…' : 'Compute BCG from CSV'}</button>
        {parsingError && <span className="small" style={{ color: '#b91c1c' }}>{parsingError}</span>}
        {resultMsg && <span className="small" style={{ color: '#065f46' }}>{resultMsg}</span>}
      </div>
      {hasRows && (
        <div style={{ marginTop: 12, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>product_name</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>market_name</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>market_growth_rate</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>market_share_percent</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>largest_rival_share_percent</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '6px 8px' }}>{r.product_name}</td>
                  <td style={{ padding: '6px 8px' }}>{r.market_name}</td>
                  <td style={{ padding: '6px 8px' }}>{r.market_growth_rate}</td>
                  <td style={{ padding: '6px 8px' }}>{r.market_share_percent}</td>
                  <td style={{ padding: '6px 8px' }}>{r.largest_rival_share_percent}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="small" style={{ marginTop: 6 }}>Showing first 50 rows.</div>
        </div>
      )}
    </div>
  );
}
