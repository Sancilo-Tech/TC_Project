import api from '../api/client';

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
  const params = new URLSearchParams({ category });
  if (parent !== undefined) params.set('parent', parent);
  return api.get<DropdownOption[]>(`/dropdowns?${params.toString()}`);
}

export async function getAllDropdowns(): Promise<DropdownOption[]> {
  return api.get<DropdownOption[]>('/dropdowns');
}

export async function addDropdown(
  category: DropdownCategory,
  value: string,
  parent?: string
): Promise<DropdownOption> {
  return api.post<DropdownOption>('/dropdowns', { category, value, parent });
}

export async function deleteDropdown(id: number): Promise<void> {
  await api.delete(`/dropdowns/${id}`);
}
