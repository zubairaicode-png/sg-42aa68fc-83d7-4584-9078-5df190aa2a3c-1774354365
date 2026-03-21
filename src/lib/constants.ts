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