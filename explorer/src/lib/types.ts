export interface StatsResponse {
  totalTransactions: number;
  totalFailed: number;
  successRate: number;
  latestSlot: string;
  recentTransactions: TransactionSummary[];
}

export interface TransactionSummary {
  id: string;
  signature: string;
  slot: string;
  blockTime: string | null;
  success: boolean;
  fee: string | null;
}

export interface TransactionListResponse {
  transactions: TransactionSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AccountBalance {
  id: string;
  accountAddress: string;
  accountIndex: number;
  preBalance: string;
  postBalance: string;
  balanceChange: string;
  slot: string;
  blockTime: string | null;
  transaction: {
    signature: string;
    success: boolean;
    fee: string | null;
  };
}

export interface AccountDetailResponse {
  account: {
    id: string;
    address: string;
    firstSeen: string;
    lastSeen: string;
  };
  latestBalance: string;
  totalTransactions: number;
  totalBalanceChange: string;
  balances: AccountBalance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
