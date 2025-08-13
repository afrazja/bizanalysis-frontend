import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL as string;
export const api = axios.create({ baseURL });

export type ProductIn = {
  name: string;
  market_share: number;
  largest_rival_share: number;
  market_growth_rate: number; // percent
};

export type BCGPoint = {
  name: string; rms: number; growth: number;
  quadrant: 'Star' | 'Cash Cow' | 'Question Mark' | 'Dog';
};

export async function postBCG(products: ProductIn[]) {
  const { data } = await api.post<BCGPoint[]>('/bcg', products);
  return data;
}

export async function getHealth() {
  const { data } = await api.get('/health');
  return data;
}

export type SnapshotIn = {
  kind: 'SWOT' | 'BCG' | 'PESTLE' | 'PORTER' | 'VRIO' | 'ANSOFF';
  payload: any;
  note?: string;
};

export type SnapshotOut = SnapshotIn & {
  id: string;
  created_at: string; // ISO string
};

export async function createSnapshot(body: SnapshotIn) {
  const { data } = await api.post<SnapshotOut>('/snapshots', body);
  return data;
}

export async function listSnapshots(params?: { kind?: string; limit?: number }) {
  const { data } = await api.get<SnapshotOut[]>('/snapshots', { params });
  return data;
}

export type SWOTIn = {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
};
export type SWOTOut = SWOTIn;

export async function postSWOT(swot: SWOTIn) {
  const { data } = await api.post<SWOTOut>('/swot', swot);
  return data;
}

export async function getSnapshot(id: string) {
  const { data } = await api.get<SnapshotOut>(`/snapshots/${id}`);
  return data;
}

export type SuggestSWOTIn = {
  company?: string;
  industry?: string;
  markets?: { name: string; growth_rate: number }[];
  products?: { name: string; market_share: number; largest_rival_share: number }[];
  points?: BCGPoint[]; // optional; pass current chart points
};

export async function suggestSWOT(body: SuggestSWOTIn){
  const { data } = await api.post<SWOTOut>('/ai/suggest-swot', body);
  return data;
}

export type MarketIn = { company_id?: string | null; name: string; growth_rate: number; size?: number | null };
export type MarketOut = MarketIn & { id: string };
export type ProductCreate = {
  company_id?: string | null; market_id?: string | null; name: string;
  market_share?: number | null; largest_rival_share?: number | null; price?: number | null; revenue?: number | null;
};
export type ProductOut = ProductCreate & { id: string };

export async function createMarket(m: MarketIn){ const { data } = await api.post<MarketOut>('/markets', m); return data; }
export async function createProduct(p: ProductCreate){ const { data } = await api.post<ProductOut>('/products', p); return data; }
export async function bulkMarkets(items: MarketIn[]){ const { data } = await api.post<{items: MarketOut[]}>('/markets/bulk', { items }); return data.items; }
export async function bulkProducts(items: ProductCreate[]){ const { data } = await api.post<{items: ProductOut[]}>('/products/bulk', { items }); return data.items; }
export async function listAllMarkets(){ const { data } = await api.get<MarketOut[]>('/markets'); return data; }
