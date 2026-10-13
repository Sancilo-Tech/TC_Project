import supabase from '../api/supabase';
import { TCFormData, TCRecord, TCDownloadLog } from '../types/tc';
import { getCollegeById } from './college';

// TCs issued before the prefix became configurable are stored as "TC/2026/003"
// and print with the college abbreviation in front ("PAC/TC/2026/003").
const LEGACY_TC_NUMBER = /^TC\/\d{4}\/\d+$/;

export function printedTCNumber(tc_number: string, collegeName?: string): string {
  if (!collegeName || !LEGACY_TC_NUMBER.test(tc_number)) return tc_number;
  const abbr = collegeName.split(' ').map(w => w[0]).join('').toUpperCase();
  return `${abbr}/${tc_number}`;
}

async function assertTCNumberFree(tc_number: string, excludeId?: number): Promise<void> {
  const legacy = tc_number.slice(tc_number.indexOf('/') + 1);
  const { data, error } = await supabase
    .from('tc_records')
    .select('id, tc_number, college_id')
    .in('tc_number', [tc_number, legacy]);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    if (row.id === excludeId) continue;
    let printed: string = row.tc_number;
    if (printed !== tc_number && row.college_id) {
      printed = printedTCNumber(printed, (await getCollegeById(row.college_id)).name);
    }
    if (printed === tc_number) throw new Error(`T.C. No. ${tc_number} is already issued.`);
  }
}

export async function createTC(data: TCFormData, tc_number: string): Promise<TCRecord> {
  await assertTCNumberFree(tc_number);
  const { data: row, error } = await supabase
    .from('tc_records')
    .insert({ ...data, tc_number })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return row as TCRecord;
}

export async function getAllTCs(): Promise<TCRecord[]> {
  const { data, error } = await supabase
    .from('tc_records')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as TCRecord[];
}

export async function getTCById(id: number): Promise<TCRecord> {
  const { data, error } = await supabase
    .from('tc_records')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as TCRecord;
}

export async function updateTC(
  id: number,
  data: Partial<TCFormData & Pick<TCRecord, 'tc_number'>>
): Promise<TCRecord> {
  if (data.tc_number) await assertTCNumberFree(data.tc_number, id);
  const { data: row, error } = await supabase
    .from('tc_records')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return row as TCRecord;
}

export async function incrementDownloadCount(id: number, newCount: number): Promise<void> {
  const { error } = await supabase
    .from('tc_records')
    .update({ download_count: newCount })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function addDownloadLog(tc_id: number, download_count: number, reason: string): Promise<void> {
  const { error } = await supabase
    .from('tc_download_logs')
    .insert({ tc_id, download_count, reason });
  if (error) throw new Error(error.message);
}

export async function getDownloadLogs(tc_id: number): Promise<TCDownloadLog[]> {
  const { data, error } = await supabase
    .from('tc_download_logs')
    .select('*')
    .eq('tc_id', tc_id)
    .order('download_count', { ascending: true });
  if (error) throw new Error(error.message);
  return data as TCDownloadLog[];
}

export async function deleteTC(id: number): Promise<void> {
  const { error } = await supabase.from('tc_records').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
