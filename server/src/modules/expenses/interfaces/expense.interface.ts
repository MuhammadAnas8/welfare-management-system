import { ExpenseStatus, FundSource } from '../enums/expense.enum.js';

export interface Expense {
  id: string;
  expense_number: string;
  branch_id: string;
  created_by: string;
  approved_by?: string;
  rejected_by?: string;
  voided_by?: string;
  title: string;
  description?: string;
  category: string;
  amount: number;
  currency: string;
  fund_source: FundSource;
  status: ExpenseStatus;
  expense_date: Date;
  approved_at?: Date;
  rejected_at?: Date;
  rejection_reason?: string;
  is_voided: boolean;
  void_reason?: string;
  voided_at?: Date;
  created_at: Date;
  updated_at: Date;
}
