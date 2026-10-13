import api from '../api/client';
import { uploadLogoToCloudinary } from '../api/cloudinary';
import { CollegeData } from '../types/tc';

export async function getAllColleges(): Promise<CollegeData[]> {
  return api.get<CollegeData[]>('/colleges');
}

export async function getCollegeById(id: number): Promise<CollegeData> {
  return api.get<CollegeData>(`/colleges/${id}`);
}

export async function createCollege(
  fields: { name: string; trust_name: string; affiliation: string; address: string },
  logoFile: File
): Promise<CollegeData> {
  const logo_url = await uploadLogoToCloudinary(logoFile);
  return api.post<CollegeData>('/colleges', { ...fields, logo_url });
}

export async function updateCollege(
  id: number,
  fields: Partial<{ name: string; trust_name: string; affiliation: string; address: string }>,
  logoFile?: File
): Promise<CollegeData> {
  const updates: Record<string, string> = { ...fields };
  if (logoFile) updates.logo_url = await uploadLogoToCloudinary(logoFile);
  return api.put<CollegeData>(`/colleges/${id}`, updates);
}

export async function deleteCollege(id: number): Promise<void> {
  await api.delete(`/colleges/${id}`);
}
