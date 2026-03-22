import jsPDF from "jspdf";

interface PaymentReceiptData {
  receiptNumber: string;
  paymentDate: string;
  invoiceNumber: string;
  customerName?: string;
  supplierName?: string;
  customerVat?: string;
  supplierVat?: string;
  paymentAmount: number;
  paymentMethod: string;
  previousBalance: number;
  newBalance: number;
  notes?: string;
  type: "sales" | "purchase";
}

export const generatePaymentReceipt = (data: PaymentReceiptData) => {
  // A5 size: 148mm x 210mm = 419.53 x 595.28 points
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a5",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 30;
  const contentWidth = pageWidth - (margin * 2);

  let yPos = margin;

  // Header with border
  doc.setFillColor(59, 130, 246); // Primary blue
  doc.rect(0, 0, pageWidth, 60, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT RECEIPT", pageWidth / 2, 35, { align: "center" });

  yPos = 80;

  // Receipt Number and Date
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  doc.setFont("helvetica", "bold");
  doc.text("Receipt No:", margin, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(data.receiptNumber, margin + 70, yPos);

  doc.setFont("helvetica", "bold");
  doc.text("Date:", pageWidth - margin - 100, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(data.paymentDate, pageWidth - margin, yPos, { align: "right" });

  yPos += 30;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 25;

  // Payment Details Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT DETAILS", margin, yPos);
  yPos += 20;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Customer/Supplier Info
  const partyName = data.type === "sales" ? "Customer" : "Supplier";
  const partyValue = data.type === "sales" ? data.customerName : data.supplierName;
  const partyVat = data.type === "sales" ? data.customerVat : data.supplierVat;

  doc.setFont("helvetica", "bold");
  doc.text(`${partyName}:`, margin, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(partyValue || "", margin + 80, yPos);
  yPos += 18;

  if (partyVat) {
    doc.setFont("helvetica", "bold");
    doc.text("VAT Number:", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(partyVat, margin + 80, yPos);
    yPos += 18;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Invoice Number:", margin, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(data.invoiceNumber, margin + 80, yPos);
  yPos += 18;

  doc.setFont("helvetica", "bold");
  doc.text("Payment Method:", margin, yPos);
  doc.setFont("helvetica", "normal");
  const methodLabels: Record<string, string> = {
    cash: "Cash",
    card: "Credit/Debit Card",
    bank_transfer: "Bank Transfer",
    cheque: "Cheque",
  };
  doc.text(methodLabels[data.paymentMethod] || data.paymentMethod, margin + 80, yPos);
  yPos += 30;

  // Payment Summary Box
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin, yPos, contentWidth, 90, 5, 5, "F");

  yPos += 20;

  // Previous Balance
  doc.setFont("helvetica", "normal");
  doc.text("Previous Balance:", margin + 15, yPos);
  doc.text(`SAR ${data.previousBalance.toFixed(2)}`, pageWidth - margin - 15, yPos, { align: "right" });
  yPos += 20;

  // Payment Amount (highlighted)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Amount:", margin + 15, yPos);
  doc.setTextColor(34, 197, 94); // Green color
  doc.text(`SAR ${data.paymentAmount.toFixed(2)}`, pageWidth - margin - 15, yPos, { align: "right" });
  doc.setTextColor(0, 0, 0);
  yPos += 25;

  // New Balance
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("New Balance:", margin + 15, yPos);
  const balanceColor = data.newBalance > 0 ? [239, 68, 68] : [34, 197, 94]; // Red if balance, green if paid
  doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
  doc.text(`SAR ${data.newBalance.toFixed(2)}`, pageWidth - margin - 15, yPos, { align: "right" });
  doc.setTextColor(0, 0, 0);

  yPos += 40;

  // Notes section (if any)
  if (data.notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", margin, yPos);
    yPos += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const notesLines = doc.splitTextToSize(data.notes, contentWidth);
    doc.text(notesLines, margin, yPos);
    yPos += (notesLines.length * 12) + 20;
  }

  // Footer
  yPos = pageHeight - 80;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text("Thank you for your payment!", pageWidth / 2, yPos, { align: "center" });
  
  yPos += 12;
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: "center" });

  // Add stamp/seal area
  yPos = pageHeight - 50;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("Authorized Signature", pageWidth - margin - 80, yPos);
  doc.setDrawColor(150, 150, 150);
  doc.line(pageWidth - margin - 100, yPos + 5, pageWidth - margin, yPos + 5);

  // Save the PDF
  const fileName = `Payment_Receipt_${data.receiptNumber}_${Date.now()}.pdf`;
  doc.save(fileName);
};

export const generateReceiptNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `RCPT-${year}-${random}`;
};