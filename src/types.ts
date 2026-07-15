export interface Contractor {
  id: string;
  name: string;
  accountNumber: string;
  contactNumber: string;
  status: string;
}

export interface Project {
  code: string;
  name: string;
  contractorId: string;
  status: string;
}

export interface IncomeEntry {
  date: string; // e.g. "09 Oct 2025" or "2025-10-09"
  contractorId: string;
  projectCode: string;
  description: string;
  amount: number;
  currency: string;
  creditReceived: number;
}

export interface ExpenseEntry {
  date: string;
  contractorId: string;
  projectCode: string;
  vendor: string;
  description: string;
  amount: number;
  currency: string;
  creditPaid: number;
}

export interface Settings {
  googleSheetUrl: string;
}

export interface AppData {
  contractors: Contractor[];
  projects: Project[];
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  settings: Settings;
  source?: string;
  synced?: boolean;
}
