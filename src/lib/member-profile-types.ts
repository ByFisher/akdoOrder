export interface MemberProfile {
  memberNumber: string;
  username?: string | null;
  firstName: string;
  lastName: string;
  balance: number;
}

export interface MemberBalanceRecord {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
  orderId: string | null;
}

export interface MemberBalanceRequestRecord {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string;
}

export interface MemberOrderRecord {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paidAt: string | null;
  table: { name: string };
  branch: { name: string };
  items: { id: string; name: string; price: number; quantity: number }[];
}
