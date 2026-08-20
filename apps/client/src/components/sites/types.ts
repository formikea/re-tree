export interface CreateSiteFormData {
  name: string;
  region: string;
  coordinates: string;
  area: string;
  owner: string;
  type: string;
  notes: string;
}

export interface TypeStyles {
  'Regional Park': string;
  'Scientific Reserve': string;
  'Conservation Area': string;
  'Private Land': string;
  [key: string]: string;
}
