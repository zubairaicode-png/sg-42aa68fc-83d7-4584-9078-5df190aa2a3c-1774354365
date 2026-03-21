import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

// ZATCA TLV (Tag-Length-Value) encoding for QR Code
function encodeZATCAQR(data: {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  total: number;
  vatAmount: number;
}): string {
  const tlvData: Array<{ tag: number; value: string }> = [
    { tag: 1, value: data.sellerName }, // Seller name
    { tag: 2, value: data.vatNumber }, // VAT number
    { tag: 3, value: data.timestamp }, // Timestamp
    { tag: 4, value: data.total.toFixed(2) }, // Invoice total with VAT
    { tag: 5, value: data.vatAmount.toFixed(2) }, // VAT amount
  ];

  let tlvString = "";
  tlvData.forEach(({ tag, value }) => {
    const tagHex = tag.toString(16).padStart(2, "0");
    const length = value.length.toString(16).padStart(2, "0");
    tlvString += tagHex + length + value;
  });

  return Buffer.from(tlvString, "hex").toString("base64");
}

// Generate QR Code as base64 image
async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 200,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("QR Code generation error:", error);
    return "";
  }
}

// Convert Gregorian to Hijri (simplified approximation)
function toHijriDate(gregorianDate: Date): string {
  const hijriYear = gregorianDate.getFullYear() - 579;
  const hijriMonth = gregorianDate.getMonth() + 1;
  const hijriDay = gregorianDate.getDate();
  
  const hijriMonths = [
    "محرم", "صفر", "ربيع الأول", "ربيع الثاني", 
    "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
    "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
  ];

  return `${hijriDay} ${hijriMonths[hijriMonth - 1]} ${hijriYear}هـ`;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  
  // Supplier (Company)
  supplierNameEn: string;
  supplierNameAr: string;
  supplierVAT: string;
  supplierCR: string;
  supplierBuildingNo: string;
  supplierStreet: string;
  supplierDistrict: string;
  supplierCity: string;
  supplierPostalCode: string;
  supplierAdditionalNo: string;
  
  // Customer
  customerName: string;
  customerVAT?: string;
  customerAddress: string;
  
  // Line Items
  items: Array<{
    itemCode?: string;
    description: string;
    descriptionAr?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    vatRate: number;
    vatAmount: number;
    total: number;
  }>;
  
  // Totals
  subtotal: number;
  totalVAT: number;
  total: number;
  
  // Payment
  paymentMethod?: string;
  paymentTerms?: string;
  
  // Notes
  notes?: string;
}

export async function generateZATCAPDF(
  invoiceData: InvoiceData,
  template: "modern" | "classic" | "premium" = "modern"
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Generate ZATCA QR Code
  const qrData = encodeZATCAQR({
    sellerName: invoiceData.supplierNameEn,
    vatNumber: invoiceData.supplierVAT,
    timestamp: invoiceData.invoiceDate.toISOString(),
    total: invoiceData.total,
    vatAmount: invoiceData.totalVAT,
  });
  
  const qrCodeImage = await generateQRCode(qrData);

  // Template selection
  switch (template) {
    case "modern":
      generateModernTemplate(doc, invoiceData, qrCodeImage);
      break;
    case "classic":
      generateClassicTemplate(doc, invoiceData, qrCodeImage);
      break;
    case "premium":
      generatePremiumTemplate(doc, invoiceData, qrCodeImage);
      break;
  }

  return doc.output("blob");
}

// Template 1: Modern Minimal (Blue accent)
function generateModernTemplate(
  doc: jsPDF,
  data: InvoiceData,
  qrCode: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor: [number, number, number] = [41, 128, 185]; // Blue
  const lightBg: [number, number, number] = [236, 240, 241]; // Light gray

  // Header with blue accent
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Company Name (English & Arabic)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(data.supplierNameEn, 15, 18);
  
  doc.setFontSize(16);
  doc.text(data.supplierNameAr, pageWidth - 15, 18, { align: "right" });

  // VAT & CR Number
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`VAT: ${data.supplierVAT} | CR: ${data.supplierCR}`, 15, 28);

  // Invoice Title
  doc.setFillColor(...lightBg);
  doc.rect(0, 45, pageWidth, 15, "F");
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", 15, 55);
  doc.text("فاتورة ضريبية", pageWidth - 15, 55, { align: "right" });

  // Invoice Details Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 65, 85, 30, 2, 2, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Number:", 20, 73);
  doc.text("رقم الفاتورة:", 20, 79);
  doc.text("Invoice Date:", 20, 85);
  doc.text("التاريخ:", 20, 91);

  doc.setFont("helvetica", "normal");
  doc.text(data.invoiceNumber, 60, 73);
  doc.text(data.invoiceNumber, 60, 79);
  doc.text(data.invoiceDate.toLocaleDateString("en-GB"), 60, 85);
  doc.text(toHijriDate(data.invoiceDate), 60, 91);

  // Customer Details Box
  doc.roundedRect(110, 65, 85, 30, 2, 2, "FD");
  
  doc.setFont("helvetica", "bold");
  doc.text("Bill To / العميل:", 115, 73);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const customerLines = doc.splitTextToSize(data.customerName, 70);
  doc.text(customerLines, 115, 79);
  
  if (data.customerVAT) {
    doc.text(`VAT: ${data.customerVAT}`, 115, 89);
  }

  // Items Table
  const tableStartY = 105;
  
  autoTable(doc, {
    startY: tableStartY,
    head: [
      [
        { content: "Item Code\nرمز الصنف", styles: { halign: "left" } },
        { content: "Description\nالوصف", styles: { halign: "left" } },
        { content: "Qty\nالكمية", styles: { halign: "center" } },
        { content: "Unit Price\nسعر الوحدة", styles: { halign: "right" } },
        { content: "Discount\nالخصم", styles: { halign: "right" } },
        { content: "Subtotal\nالمجموع الفرعي", styles: { halign: "right" } },
        { content: "VAT %\nضريبة", styles: { halign: "center" } },
        { content: "Total Tax\nإجمالي الضريبة", styles: { halign: "right" } },
        { content: "Total\nالمجموع", styles: { halign: "right" } },
      ],
    ],
    body: data.items.map(item => {
      const itemSubtotal = (item.quantity * item.unitPrice) - (item.discount || 0);
      return [
        item.itemCode || "-",
        item.descriptionAr 
          ? `${item.description}\n${item.descriptionAr}`
          : item.description,
        item.quantity.toString(),
        item.unitPrice.toFixed(2),
        item.discount ? item.discount.toFixed(2) : "0.00",
        itemSubtotal.toFixed(2),
        `${item.vatRate}%`,
        item.vatAmount.toFixed(2),
        item.total.toFixed(2),
      ];
    }),
    foot: [
      ["", "", "", "", "", "", "", "Subtotal / المجموع الفرعي:", data.subtotal.toFixed(2)],
      ["", "", "", "", "", "", "", "VAT (15%) / ضريبة القيمة المضافة:", data.totalVAT.toFixed(2)],
      ["", "", "", "", "", "", "", { content: "Total / الإجمالي:", styles: { fontStyle: "bold" } }, { content: data.total.toFixed(2), styles: { fontStyle: "bold" } }],
    ],
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
    },
    footStyles: {
      fillColor: lightBg,
      textColor: [0, 0, 0],
      fontStyle: "normal",
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    margin: { left: 15, right: 15 },
  });

  // QR Code
  const finalY = (doc as any).lastAutoTable.finalY || 200;
  if (qrCode) {
    doc.addImage(qrCode, "PNG", 15, finalY + 10, 40, 40);
  }

  // Footer with National Address
  const footerY = finalY + 55;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  
  const addressEn = `${data.supplierBuildingNo}, ${data.supplierStreet}, ${data.supplierDistrict}, ${data.supplierCity} ${data.supplierPostalCode}`;
  const addressAr = `رقم المبنى ${data.supplierBuildingNo}، ${data.supplierStreet}، ${data.supplierDistrict}، ${data.supplierCity} ${data.supplierPostalCode}`;
  
  doc.text(addressEn, pageWidth / 2, footerY, { align: "center" });
  doc.text(addressAr, pageWidth / 2, footerY + 5, { align: "center" });

  if (data.notes) {
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`Notes: ${data.notes}`, 60, finalY + 20);
  }
}

// Template 2: Classic Professional (Green accent)
function generateClassicTemplate(
  doc: jsPDF,
  data: InvoiceData,
  qrCode: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor: [number, number, number] = [39, 174, 96]; // Green
  const lightBg: [number, number, number] = [232, 245, 233];

  // Simple header with border
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1);
  doc.line(15, 20, pageWidth - 15, 20);

  // Company Name
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(data.supplierNameEn, 15, 15);
  doc.text(data.supplierNameAr, pageWidth - 15, 15, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`VAT Number: ${data.supplierVAT}`, 15, 27);
  doc.text(`CR Number: ${data.supplierCR}`, 15, 32);

  // Invoice Title
  doc.setFillColor(...primaryColor);
  doc.rect(15, 40, pageWidth - 30, 12, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE - فاتورة ضريبية", pageWidth / 2, 48, { align: "center" });

  // Two-column layout for details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  
  // Left column - Invoice details
  doc.text("Invoice Details:", 15, 60);
  doc.setFont("helvetica", "normal");
  doc.text(`Number: ${data.invoiceNumber}`, 15, 66);
  doc.text(`Date: ${data.invoiceDate.toLocaleDateString("en-GB")}`, 15, 72);
  doc.text(`Hijri: ${toHijriDate(data.invoiceDate)}`, 15, 78);

  // Right column - Customer details
  doc.setFont("helvetica", "bold");
  doc.text("Customer Details:", 110, 60);
  doc.setFont("helvetica", "normal");
  const custLines = doc.splitTextToSize(data.customerName, 80);
  doc.text(custLines, 110, 66);
  
  if (data.customerVAT) {
    doc.text(`VAT: ${data.customerVAT}`, 110, 78);
  }

  // Items Table
  autoTable(doc, {
    startY: 90,
    head: [[
      "Item Code",
      "Item Description",
      "Quantity",
      "Unit Price",
      "Discount",
      "Subtotal",
      "VAT %",
      "Total Tax",
      "Total",
    ]],
    body: data.items.map(item => {
      const itemSubtotal = (item.quantity * item.unitPrice) - (item.discount || 0);
      return [
        item.itemCode || "-",
        item.description,
        item.quantity.toString(),
        item.unitPrice.toFixed(2),
        item.discount ? item.discount.toFixed(2) : "0.00",
        itemSubtotal.toFixed(2),
        `${item.vatRate}%`,
        item.vatAmount.toFixed(2),
        item.total.toFixed(2),
      ];
    }),
    foot: [
      ["", "", "", "", "", "", "", "Subtotal:", data.subtotal.toFixed(2)],
      ["", "", "", "", "", "", "", "VAT (15%):", data.totalVAT.toFixed(2)],
      ["", "", "", "", "", "", "", { content: "Total Amount:", styles: { fontStyle: "bold" } }, { content: `SAR ${data.total.toFixed(2)}`, styles: { fontStyle: "bold" } }],
    ],
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: lightBg,
      fontSize: 10,
    },
    margin: { left: 15, right: 15 },
  });

  // QR Code
  const finalY = (doc as any).lastAutoTable.finalY || 200;
  if (qrCode) {
    doc.addImage(qrCode, "PNG", pageWidth - 55, finalY + 10, 40, 40);
  }

  // National Address Footer
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(15, finalY + 55, pageWidth - 15, finalY + 55);
  
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const addressText = `National Address: Building ${data.supplierBuildingNo}, ${data.supplierStreet}, ${data.supplierDistrict}, ${data.supplierCity}, ${data.supplierPostalCode}, Additional No: ${data.supplierAdditionalNo}`;
  const addressLines = doc.splitTextToSize(addressText, pageWidth - 30);
  doc.text(addressLines, pageWidth / 2, finalY + 60, { align: "center" });
}

// Template 3: Premium Corporate (Gold accent)
function generatePremiumTemplate(
  doc: jsPDF,
  data: InvoiceData,
  qrCode: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor: [number, number, number] = [212, 175, 55]; // Gold
  const darkText: [number, number, number] = [44, 62, 80];
  const lightBg: [number, number, number] = [254, 250, 224];

  // Elegant header with gradient effect (simulated with rectangles)
  doc.setFillColor(44, 62, 80);
  doc.rect(0, 0, pageWidth, 50, "F");
  
  doc.setFillColor(...primaryColor);
  doc.rect(0, 45, pageWidth, 5, "F");

  // Company logo area (placeholder)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, 10, 30, 30, 3, 3, "F");
  
  // Company Name with elegant styling
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(data.supplierNameEn, 50, 22);
  
  doc.setFontSize(14);
  doc.text(data.supplierNameAr, 50, 30);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`VAT: ${data.supplierVAT} | CR: ${data.supplierCR}`, 50, 38);

  // Invoice header with gold accent
  doc.setFillColor(...lightBg);
  doc.rect(0, 55, pageWidth, 20, "F");
  
  doc.setTextColor(...darkText);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", 15, 67);
  
  doc.setFontSize(18);
  doc.text("فاتورة ضريبية", pageWidth - 15, 67, { align: "right" });

  // Premium detail boxes with shadows
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  
  // Invoice info box
  doc.roundedRect(15, 80, 90, 35, 3, 3, "FD");
  doc.setFillColor(...primaryColor);
  doc.roundedRect(15, 80, 90, 8, 3, 3, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Information", 20, 86);
  
  doc.setTextColor(...darkText);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice No: ${data.invoiceNumber}`, 20, 95);
  doc.text(`Date: ${data.invoiceDate.toLocaleDateString("en-GB")}`, 20, 101);
  doc.text(`التاريخ الهجري: ${toHijriDate(data.invoiceDate)}`, 20, 107);

  // Customer info box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(110, 80, 85, 35, 3, 3, "FD");
  doc.setFillColor(...primaryColor);
  doc.roundedRect(110, 80, 85, 8, 3, 3, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Customer Details", 115, 86);
  
  doc.setTextColor(...darkText);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const custText = doc.splitTextToSize(data.customerName, 70);
  doc.text(custText, 115, 95);
  
  if (data.customerVAT) {
    doc.text(`VAT: ${data.customerVAT}`, 115, 107);
  }

  // Premium items table
  autoTable(doc, {
    startY: 125,
    head: [[
      { content: "Code", styles: { halign: "left" } },
      { content: "Description / الوصف", styles: { halign: "left" } },
      { content: "Qty", styles: { halign: "center" } },
      { content: "Price", styles: { halign: "right" } },
      { content: "Disc.", styles: { halign: "right" } },
      { content: "Subtotal", styles: { halign: "right" } },
      { content: "VAT%", styles: { halign: "center" } },
      { content: "VAT Amt", styles: { halign: "right" } },
      { content: "Total", styles: { halign: "right" } },
    ]],
    body: data.items.map(item => {
      const itemSubtotal = (item.quantity * item.unitPrice) - (item.discount || 0);
      return [
        item.itemCode || "-",
        item.description,
        item.quantity.toString(),
        item.unitPrice.toFixed(2),
        item.discount ? item.discount.toFixed(2) : "0.00",
        itemSubtotal.toFixed(2),
        `${item.vatRate}%`,
        item.vatAmount.toFixed(2),
        item.total.toFixed(2),
      ];
    }),
    foot: [
      ["", "", "", "", "", "", "", "Subtotal:", data.subtotal.toFixed(2)],
      ["", "", "", "", "", "", "", "VAT (15%):", data.totalVAT.toFixed(2)],
      ["", "", "", "", "", "", "", { content: "TOTAL", styles: { fontStyle: "bold", fontSize: 11 } }, { content: `SAR ${data.total.toFixed(2)}`, styles: { fontStyle: "bold", fontSize: 11, fillColor: primaryColor, textColor: [255, 255, 255] } }],
    ],
    headStyles: {
      fillColor: primaryColor,
      textColor: darkText,
      fontSize: 9,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkText,
    },
    footStyles: {
      fillColor: [250, 250, 250],
      fontSize: 10,
      textColor: darkText,
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    margin: { left: 15, right: 15 },
  });

  // QR Code with frame
  const finalY = (doc as any).lastAutoTable.finalY || 200;
  if (qrCode) {
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.roundedRect(13, finalY + 8, 44, 44, 2, 2, "S");
    doc.addImage(qrCode, "PNG", 15, finalY + 10, 40, 40);
    
    doc.setFontSize(8);
    doc.setTextColor(...darkText);
    doc.text("Scan for verification", 35, finalY + 55, { align: "center" });
  }

  // Elegant footer
  doc.setFillColor(...darkText);
  doc.rect(0, finalY + 65, pageWidth, 30, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("National Address:", pageWidth / 2, finalY + 73, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const fullAddress = `Building ${data.supplierBuildingNo}, ${data.supplierStreet}, ${data.supplierDistrict}, ${data.supplierCity} ${data.supplierPostalCode}, Additional: ${data.supplierAdditionalNo}`;
  doc.text(fullAddress, pageWidth / 2, finalY + 80, { align: "center" });
  
  doc.setFontSize(7);
  doc.text("This is a computer-generated invoice and is valid without signature", pageWidth / 2, finalY + 87, { align: "center" });
}