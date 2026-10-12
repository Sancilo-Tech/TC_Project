export interface TCFormData {
  student_name: string;
  father_name: string;
  mother_name: string;
  guardian_name: string;
  parent_name: string;   // kept for backward compat
  gender: string;
  nationality: string;
  religion: string;
  community: string;
  caste: string;
  dob: string;
  dob_words: string;
  admission_date: string;
  study_period: string;
  leaving_date: string;
  class_at_leaving: string;
  medium: string;
  promotion_status: string;
  application_date: string;
  reason: string;
  conduct: string;
  id_number: string;
  umis_number: string;
  college_id: number;
}

export interface TCRecord extends TCFormData {
  id: number;
  tc_number: string;
  created_at: string;
  download_count: number;
}

export interface FieldConfig {
  name: keyof TCFormData;
  label: string;
  full?: boolean;
  textarea?: boolean;
  type?: string;
  disabled?: boolean;
}

export interface TCDownloadLog {
  id: number;
  tc_id: number;
  download_count: number;
  reason: string;
  downloaded_at: string;
}

export interface CollegeData {
  id: number;
  name: string;
  trust_name: string;
  affiliation: string;
  address: string;
  logo_url: string;
  created_at: string;
}
