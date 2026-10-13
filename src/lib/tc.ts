import api from '../api/client';
import { TCFormData, TCRecord, TCDownloadLog } from '../types/tc';

// TCs issued before the prefix became configurable are stored as "TC/2026/003"
// and print with the college abbreviation in front ("PAC/TC/2026/003").
// The server repeats this rule when it checks for duplicates (server/routes/tcs.js).
const LEGACY_TC_NUMBER = /^TC\/\d{4}\/\d+$/;

export function printedTCNumber(tc_number: string, collegeName?: string): string {
  if (!collegeName || !LEGACY_TC_NUMBER.test(tc_number)) return tc_number;
  const abbr = collegeName.split(' ').map(w => w[0]).join('').toUpperCase();
  return `${abbr}/${tc_number}`;
}

export async function createTC(data: TCFormData, tc_number: string): Promise<TCRecord> {
  return api.post<TCRecord>('/tcs', { ...data, tc_number });
}

export async function getAllTCs(): Promise<TCRecord[]> {
  return api.get<TCRecord[]>('/tcs');
}

export async function getTCById(id: number): Promise<TCRecord> {
  return api.get<TCRecord>(`/tcs/${id}`);
}

export async function updateTC(
  id: number,
  data: Partial<TCFormData & Pick<TCRecord, 'tc_number'>>
): Promise<TCRecord> {
  return api.put<TCRecord>(`/tcs/${id}`, data);
}

export async function incrementDownloadCount(id: number, newCount: number): Promise<void> {
  await api.put(`/tcs/${id}/download-count`, { download_count: newCount });
}

export async function addDownloadLog(tc_id: number, download_count: number, reason: string): Promise<void> {
  await api.post(`/tcs/${tc_id}/download-logs`, { download_count, reason });
}

export async function getDownloadLogs(tc_id: number): Promise<TCDownloadLog[]> {
  return api.get<TCDownloadLog[]>(`/tcs/${tc_id}/download-logs`);
}

export async function deleteTC(id: number): Promise<void> {
  await api.delete(`/tcs/${id}`);
}
