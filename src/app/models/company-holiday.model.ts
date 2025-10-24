// Model per CompanyHoliday frontend
export interface CompanyHoliday {
  id: number;
  date: string; // ISO date format
  name: string;
  description?: string;
  type: HolidayType;
  typeDisplayName: string;
  recurring: boolean;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export enum HolidayType {
  FESTIVITY = 'FESTIVITY',
  COMPANY_CLOSURE = 'COMPANY_CLOSURE',
  MAINTENANCE = 'MAINTENANCE',
  OTHER = 'OTHER'
}

export interface CreateCompanyHolidayRequest {
  date: string; // ISO date format
  name: string;
  description?: string;
  type: HolidayType;
  recurring: boolean;
}

export interface UpdateCompanyHolidayRequest {
  date?: string;
  name?: string;
  description?: string;
  type?: HolidayType;
  recurring?: boolean;
  active?: boolean;
}

export const HolidayTypeLabels: { [key in HolidayType]: string } = {
  [HolidayType.FESTIVITY]: 'Festività',
  [HolidayType.COMPANY_CLOSURE]: 'Chiusura Aziendale',
  [HolidayType.MAINTENANCE]: 'Manutenzione',
  [HolidayType.OTHER]: 'Altro'
};
