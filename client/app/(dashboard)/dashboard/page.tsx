export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard
        </h1>

        <p className="text-muted-foreground">
          Welcome back to Village Welfare Management System.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-card p-6">
          Total Donations
        </div>

        <div className="rounded-xl border bg-card p-6">
          Pending Expenses
        </div>

        <div className="rounded-xl border bg-card p-6">
          Local Funds
        </div>

        <div className="rounded-xl border bg-card p-6">
          Branches
        </div>
      </div>
    </div>
  );
}