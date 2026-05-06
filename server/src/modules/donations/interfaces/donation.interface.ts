
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
}

export interface Donation {
  id: string;
  branch_id: string;
  donor_name: string;
  donor_phone: string | null;
  amount: number;
  currency: string;
  is_voided: boolean;
  void_reason: string | null;
  voided_by: string | null;
  voided_at: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  edit_locked_at: Date;
}

export interface DonationTransfer {
  id: string;
  from_branch_id: string;
  to_branch_id: string;
  amount_original: number;
  currency_original: string;
  estimated_pkr: number;
  received_pkr: number | null;
  status: string;
  submitted_by: string;
  received_by: string | null;
  submitted_at: Date;
  received_at: Date | null;
  notes: string | null;
}
