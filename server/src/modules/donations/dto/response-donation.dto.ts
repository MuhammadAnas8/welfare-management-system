// dto/donation-response.dto.ts
export class DonationResponseDto {
  id!: string;
  donor_name!: string;
  donor_phone?: string;

  amount!: number;
  currency!: string;

  branch_id!: string;
  branch_name!: string;

  created_by!: string;
  created_by_name!: string;

  voided_by?: string;
  voided_by_name?: string;

  created_at!: string;
}