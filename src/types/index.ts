// Core ERP Types for Saudi Arabia

export interface Customer {
  id: string;
  name: string;
  nameAr?: string;
  email: string;
  phone: string;
  vatNumber?: string;
  crNumber?: string; // Commercial Registration Number
  address: string;
  buildingNumber?: string; // ZATCA Phase 2
  streetName?: string; // ZATCA Phase 2
  additionalNumber?: string; // ZATCA Phase 2
  postalCode?: string; // ZATCA Phase 2
  city: string;
  country: string;
  creditLimit: number;
  balance: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  nameAr?: string;
  email: string;
  phone: string;
  vatNumber?: string;
  crNumber?: string; // Commercial Registration Number
  address: string;
  buildingNumber?: string; // ZATCA Phase 2
  streetName?: string; // ZATCA Phase 2
  additionalNumber?: string; // ZATCA Phase 2
  postalCode?: string; // ZATCA Phase 2
  city: string;
  country: string;
  balance: number;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  nameAr?: string;
  description?: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  maxStock: number;
  taxable: boolean;
  barcode?: string;
  image?: string;
  createdAt: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: "sales" | "purchase";
  customerId?: string;
  supplierId?: string;
  date: string;
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paid: number;
  balance: number;
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: "cash" | "bank" | "cheque" | "card";
  reference?: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface AccountTransaction {
  id: string;
  date: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
  reference?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  netProfit: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  lowStockItems: number;
  pendingInvoices: number;
}

export type InvoiceStatus = "draft" | "pending" | "paid" | "overdue" | "cancelled";
export type PaymentMethod = "cash" | "bank" | "cheque" | "card";
export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";