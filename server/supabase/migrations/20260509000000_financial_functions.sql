
-- ========================================================
-- FINANCIAL LEDGER FUNCTIONS
-- ========================================================

-- Temporary PKR conversion helper
-- Later this should use an exchange_rates table
CREATE OR REPLACE FUNCTION public.calculate_pkr(
  p_amount numeric,
  p_currency text
)
RETURNS numeric AS $$
BEGIN
  RETURN p_amount * CASE
    WHEN UPPER(p_currency) = 'USD' THEN 280
    WHEN UPPER(p_currency) = 'GBP' THEN 350
    WHEN UPPER(p_currency) = 'EUR' THEN 300
    WHEN UPPER(p_currency) = 'SAR' THEN 75
    WHEN UPPER(p_currency) = 'AED' THEN 76
    ELSE 1
  END;
END;
$$ LANGUAGE plpgsql STABLE;



-- ========================================================
-- BRANCH FINANCIAL STATS
-- ========================================================
CREATE OR REPLACE FUNCTION public.get_branch_financial_stats(
  p_branch_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_total_donations numeric;
  v_total_sent_to_ho numeric;
  v_total_local_expenses numeric;
  v_pending_ho_requests_amount numeric;
  v_pending_ho_requests_count bigint;
  v_balance numeric;
BEGIN

  -- Total Donations
  SELECT COALESCE(
    SUM(calculate_pkr(amount, currency)),
    0
  )
  INTO v_total_donations
  FROM public.donations
  WHERE branch_id = p_branch_id
    AND is_voided = false;

  -- Total Sent To HO
  SELECT COALESCE(
    SUM(received_pkr),
    0
  )
  INTO v_total_sent_to_ho
  FROM public.donation_transfers
  WHERE from_branch_id = p_branch_id
    AND status = 'received';

  -- Total Approved Local Expenses
  SELECT COALESCE(
    SUM(calculate_pkr(amount, currency)),
    0
  )
  INTO v_total_local_expenses
  FROM public.expenses
  WHERE branch_id = p_branch_id
    AND status = 'approved'
    AND fund_source = 'local'
    AND is_voided = false;

  -- Pending HO Requests Amount
  SELECT COALESCE(
    SUM(calculate_pkr(amount, currency)),
    0
  )
  INTO v_pending_ho_requests_amount
  FROM public.expenses
  WHERE branch_id = p_branch_id
    AND status = 'pending'
    AND fund_source = 'ho'
    AND is_voided = false;

  -- Pending HO Requests Count
  SELECT COUNT(*)
  INTO v_pending_ho_requests_count
  FROM public.expenses
  WHERE branch_id = p_branch_id
    AND status = 'pending'
    AND fund_source = 'ho'
    AND is_voided = false;

  -- Remaining Local Balance
  v_balance :=
    v_total_donations
    - v_total_sent_to_ho
    - v_total_local_expenses;

  RETURN jsonb_build_object(
    'total_donations', v_total_donations,
    'total_sent_to_ho', v_total_sent_to_ho,
    'local_expenses', v_total_local_expenses,
    'remaining_local_balance', v_balance,
    'pending_ho_requests_amount', v_pending_ho_requests_amount,
    'pending_ho_requests_count', v_pending_ho_requests_count
  );

END;
$$ LANGUAGE plpgsql STABLE;



-- ========================================================
-- HEAD OFFICE / GLOBAL FINANCIAL STATS
-- ========================================================
CREATE OR REPLACE FUNCTION public.get_ho_financial_stats()
RETURNS jsonb AS $$
DECLARE
  v_total_received_from_branches numeric;
  v_total_ho_expenses numeric;
  v_ho_balance numeric;

  v_total_donations_all numeric;
  v_total_expenses_all numeric;
  v_total_local_expenses_all numeric;
  v_total_transferred_all numeric;
  v_total_local_funds_all numeric;

  v_pending_requests_count bigint;
BEGIN

  -- Total Transfers Received
  SELECT COALESCE(
    SUM(received_pkr),
    0
  )
  INTO v_total_received_from_branches
  FROM public.donation_transfers
  WHERE status = 'received';

  -- Total Approved HO Expenses
  SELECT COALESCE(
    SUM(calculate_pkr(amount, currency)),
    0
  )
  INTO v_total_ho_expenses
  FROM public.expenses
  WHERE fund_source = 'ho'
    AND status = 'approved'
    AND is_voided = false;

  -- HO Available Balance
  v_ho_balance :=
    v_total_received_from_branches
    - v_total_ho_expenses;

  -- Global Donations
  SELECT COALESCE(
    SUM(calculate_pkr(amount, currency)),
    0
  )
  INTO v_total_donations_all
  FROM public.donations
  WHERE is_voided = false;

  -- Global Approved Expenses
  SELECT COALESCE(
    SUM(calculate_pkr(amount, currency)),
    0
  )
  INTO v_total_expenses_all
  FROM public.expenses
  WHERE status = 'approved'
    AND is_voided = false;

  -- Global Local Expenses
  SELECT COALESCE(
    SUM(calculate_pkr(amount, currency)),
    0
  )
  INTO v_total_local_expenses_all
  FROM public.expenses
  WHERE status = 'approved'
    AND fund_source = 'local'
    AND is_voided = false;

  -- Transfers To HO
  v_total_transferred_all :=
    v_total_received_from_branches;

  -- Total Remaining Local Funds
  v_total_local_funds_all :=
    v_total_donations_all
    - v_total_transferred_all
    - v_total_local_expenses_all;

  -- Pending Requests Count
  SELECT COUNT(*)
  INTO v_pending_requests_count
  FROM public.expenses
  WHERE status = 'pending'
    AND is_voided = false;

  RETURN jsonb_build_object(
    'ho_available_funds', v_ho_balance,
    'total_donations_all', v_total_donations_all,
    'total_expenses_all', v_total_expenses_all,
    'total_transferred_all', v_total_transferred_all,
    'total_local_funds_all', v_total_local_funds_all,
    'pending_requests_count', v_pending_requests_count
  );

END;
$$ LANGUAGE plpgsql STABLE;



-- ========================================================
-- BRANCH COMPARISON STATS
-- ========================================================
CREATE OR REPLACE FUNCTION public.get_branches_comparison()
RETURNS TABLE (
  branch_id uuid,
  branch_name text,
  total_donations numeric,
  total_expenses numeric,
  current_balance numeric
) AS $$
BEGIN

  RETURN QUERY

  SELECT
    b.id,
    b.name,

    -- Donations
    COALESCE((
      SELECT SUM(calculate_pkr(d.amount, d.currency))
      FROM public.donations d
      WHERE d.branch_id = b.id
        AND d.is_voided = false
    ), 0) AS total_donations,

    -- Approved Expenses
    COALESCE((
      SELECT SUM(calculate_pkr(e.amount, e.currency))
      FROM public.expenses e
      WHERE e.branch_id = b.id
        AND e.status = 'approved'
        AND e.is_voided = false
    ), 0) AS total_expenses,

    -- Current Local Balance
    (
      COALESCE((
        SELECT SUM(calculate_pkr(d.amount, d.currency))
        FROM public.donations d
        WHERE d.branch_id = b.id
          AND d.is_voided = false
      ), 0)

      -

      COALESCE((
        SELECT SUM(received_pkr)
        FROM public.donation_transfers dt
        WHERE dt.from_branch_id = b.id
          AND dt.status = 'received'
      ), 0)

      -

      COALESCE((
        SELECT SUM(calculate_pkr(e.amount, e.currency))
        FROM public.expenses e
        WHERE e.branch_id = b.id
          AND e.status = 'approved'
          AND e.fund_source = 'local'
          AND e.is_voided = false
      ), 0)

    ) AS current_balance

  FROM public.branches b
  ORDER BY b.name;

END;
$$ LANGUAGE plpgsql STABLE;
