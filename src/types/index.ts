export type TransactionFormData = Record<string, unknown>;

export type SaleFormData = {
  businessLineId: number;
  items: { productId: number; quantity: number; price: number }[];
  paymentMethod: 'CASH' | 'BANK';
  discountId?: number;
};

export type PurchaseFormData = {
  category: 'INVENTORY' | 'SUPPLY' | 'ASSET';
  businessLineId?: number;
  items: { name: string; quantity: number; unit: string; price: number }[];
  paymentMethod: 'CASH' | 'BANK';
  isCredit: boolean;
  supplierName?: string;
};

export type ExpenseFormData = {
  accountCode: string;
  businessLineId?: number;
  amount: number;
  description: string;
  paymentMethod: 'CASH' | 'BANK';
};

export type SeblakSaleFormData = {
  toppings: { toppingId: number; quantity: number }[];
  totalPrice: number;
  paymentMethod: 'CASH' | 'BANK';
};

export type WasteFormData = {
  businessLineId: number;
  items: { inventoryId: number; quantity: number; estimatedCost: number }[];
  notes?: string;
};

export type ShiftData = {
  openingCash: number;
  closingCash?: number;
  status: 'OPEN' | 'CLOSED';
};

export type ReportFilter = {
  startDate: Date;
  endDate: Date;
  businessLineId?: number;
};

export type DashboardSummary = {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  revenueByBusiness: Record<string, number>;
  lowStockItems: any[];
  pendingPayables: any[];
};

export type AiMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};
