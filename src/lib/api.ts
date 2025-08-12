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
