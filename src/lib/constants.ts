// Saudi Arabia Tax and Business Constants

export const SAUDI_VAT_RATE = 15; // 15% VAT in Saudi Arabia

export const INVOICE_STATUSES = [
  { value: "draft", label: "Draft", color: "gray" },
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "paid", label: "Paid", color: "green" },
  { value: "overdue", label: "Overdue", color: "red" },
  { value: "cancelled", label: "Cancelled", color: "gray" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "card", label: "Credit/Debit Card" },
] as const;

export const PRODUCT_UNITS = [
  { value: "pcs", label: "Pieces" },
  { value: "kg", label: "Kilograms" },
  { value: "ltr", label: "Liters" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "set", label: "Set" },
] as const;

export const PRODUCT_CATEGORIES = [
  "Electronics",
  "Food & Beverage",
  "Clothing & Apparel",
  "Hardware & Tools",
  "Office Supplies",
  "Medical Supplies",
  "Automotive",
  "Other",
] as const;

export const CURRENCIES = {
  SAR: { symbol: "SAR", name: "Saudi Riyal", code: "SAR" },
} as const;

export const DATE_FORMAT = "yyyy-MM-dd";
export const DATETIME_FORMAT = "yyyy-MM-dd HH:mm";

export const ZATCA_REQUIREMENTS = {
  qrCodeRequired: true,
  invoiceNumberFormat: "INV-YYYY-XXXXX",
  taxIdRequired: true,
  billingAddressRequired: true,
} as const;

export const ACCOUNTS = [
  { code: "1100", name: "Cash on Hand", type: "asset" },
  { code: "1110", name: "Bank Account", type: "asset" },
  { code: "1200", name: "Accounts Receivable", type: "asset" },
  { code: "1300", name: "Inventory", type: "asset" },
  { code: "1400", name: "Prepaid Expenses", type: "asset" },
  { code: "1500", name: "Fixed Assets", type: "asset" },
  { code: "2100", name: "Accounts Payable", type: "liability" },
  { code: "2200", name: "VAT Payable", type: "liability" },
  { code: "2300", name: "Accrued Salaries", type: "liability" },
  { code: "2400", name: "Short-term Loans", type: "liability" },
  { code: "3100", name: "Owner's Equity", type: "equity" },
  { code: "3200", name: "Retained Earnings", type: "equity" },
  { code: "4100", name: "Sales Revenue", type: "revenue" },
  { code: "4200", name: "Service Revenue", type: "revenue" },
  { code: "5100", name: "Cost of Goods Sold", type: "expense" },
  { code: "5200", name: "Salaries Expense", type: "expense" },
  { code: "5300", name: "Rent Expense", type: "expense" },
  { code: "5400", name: "Utilities Expense", type: "expense" },
] as const;