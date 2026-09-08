export interface EskizLoginResponse {
  message: string;
  data: { token: string };
  token_type?: string;
}

export interface EskizSendSmsResponse {
  id: string | number;
  message?: string;
  status?: string;
}

export interface EskizSendSmsParams {
  phone: string; // 998901234567 (without +)
  message: string;
  requestId?: string;
}

// Eskiz callback statuslari (DELIVIVERED — Eskiz tomonidagi typo, original ko'rinishda saqlanadi)
export type EskizDeliveryStatus =
  | 'waiting'
  | 'TRANSMITTED'
  | 'DELIVIVERED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'UNDELIV';
