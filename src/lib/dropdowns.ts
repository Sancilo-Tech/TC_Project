import supabase from '../api/supabase';

export type DropdownCategory =
  | 'nationality'
  | 'religion'
  | 'community'
  | 'caste'
  | 'medium'
  | 'promotion_status'
  | 'conduct'
  | 'reason'
  | 'tc_prefix';

export interface DropdownOption {
  id: number;
  category: DropdownCategory;
  value: string;
  parent?: string | null; // for community→religion, caste→community
  sort_order: number;
  created_at: string;
}

export async function getDropdowns(category: DropdownCategory, parent?: string): Promise<DropdownOption[]> {
  let q = supabase
    .from('dropdown_options')
    .select('*')
    .eq('category', category)
    .order('sort_order', { ascending: true })
    .order('value', { ascending: true });
  if (parent !== undefined) q = q.eq('parent', parent);
  const { data, error } = await q;
  if (error) throw error;
  return data as DropdownOption[];
}

export async function getAllDropdowns(): Promise<DropdownOption[]> {
  const { data, error } = await supabase
    .from('dropdown_options')
    .select('*')
    .order('category')
    .order('sort_order', { ascending: true })
    .order('value', { ascending: true });
  if (error) throw error;
  return data as DropdownOption[];
}

export async function addDropdown(
  category: DropdownCategory,
  value: string,
  parent?: string
): Promise<DropdownOption> {
  const { data, error } = await supabase
    .from('dropdown_options')
    .insert({ category, value: value.trim(), parent: parent || null, sort_order: 999 })
    .select()
    .single();
  if (error) throw error;
  return data as DropdownOption;
}

export async function deleteDropdown(id: number): Promise<void> {
  const { error } = await supabase.from('dropdown_options').delete().eq('id', id);
  if (error) throw error;
}
