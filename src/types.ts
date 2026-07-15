export interface Contractor {
  id: string;
  name: string;
  accountNumber: string;
  contactNumber: string;
  status: string;
  openingBalance?: number;
}

export interface Project {
  code: string;
  name: string;
  contractorId: string;
  status: string;
}

export interface IncomeEntry {
  id?: string;
  date: string; // e.g. "09 Oct 2025" or "2025-10-09"
  contractorId?: string; // Optional since contractor can be optional/general
  projectCode: string;
  description: string;
  amount: number;
  currency: string;
  creditReceived: number;
  paymentMethod?: string;
  entryType?: string;
}

export interface ExpenseEntry {
  id?: string;
  date: string;
  contractorId?: string; // Optional for General Expenses
  projectCode: string;
  vendor: string;
  description: string;
  amount: number;
  currency: string;
  creditPaid: number;
  paymentMethod?: string;
  entryType?: string;
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
