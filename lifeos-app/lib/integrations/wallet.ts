// BudgetBakers only shows the exact REST API docs inside your own account
// (Wallet web app -> profile -> Settings -> Rest API/MCP), because the base
// URL and auth header format are only confirmed once you generate a token
// there. This client is wired to the shape BudgetBakers documents publicly
// (token-based auth, transactions + accounts endpoints) — once you generate
// your token, check the in-app docs and adjust BASE_URL / header name below
// if they differ.

const WALLET_API_BASE = process.env.WALLET_API_BASE || "https://api.budgetbakers.com/v1";

export async function fetchWalletTransactions(apiToken: string, sinceIso: string) {
  const res = await fetch(
    `${WALLET_API_BASE}/records?since=${encodeURIComponent(sinceIso)}&limit=100`,
    { headers: { Authorization: `Bearer ${apiToken}` } }
  );
  if (!res.ok) throw new Error(`Wallet transactions fetch failed: ${res.status}`);
  return res.json() as Promise<{
    records: Array<{
      id: string;
      amount: number;
      currency: string;
      category?: string;
      account?: string;
      date: string;
      note?: string;
    }>;
  }>;
}

export async function fetchWalletAccounts(apiToken: string) {
  const res = await fetch(`${WALLET_API_BASE}/accounts`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  if (!res.ok) throw new Error(`Wallet accounts fetch failed: ${res.status}`);
  return res.json() as Promise<{
    accounts: Array<{ id: string; name: string; balance: number; currency: string }>;
  }>;
}
