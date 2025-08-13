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
