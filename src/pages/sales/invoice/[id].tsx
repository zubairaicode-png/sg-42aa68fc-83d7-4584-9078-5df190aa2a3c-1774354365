import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customer: {
    name: string;
    nameAr?: string;
    vatNumber?: string;
    crNumber?: string;
    buildingNumber?: string;
    streetName?: string;
    additionalNumber?: string;
    postalCode?: string;
    city: string;
    phone: string;
    email: string;
  };
  items: Array<{
    itemCode?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    vatRate: number;
    amount: number;
  }>;
  subtotal: number;
  totalVat: number;
  total: number;
  notes?: string;
  status: string;
}

export default function InvoiceViewPage() {
  const router = useRouter();
  const { id } = router.query;
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [qrCode, setQrCode] = useState("");
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load company info from localStorage
    const savedCompanyInfo = localStorage.getItem("companyInfo");
    if (savedCompanyInfo) {
      setCompanyInfo(JSON.parse(savedCompanyInfo));
    } else {
      // Default company info
      setCompanyInfo({
        nameEn: "Your Company Name",
        nameAr: "اسم شركتك",
        vatNumber: "300000000000003",
        crNumber: "1010000000",
        buildingNumber: "1234",
        streetName: "King Fahd Road",
        additionalNumber: "5678",
        postalCode: "12345",
        city: "Riyadh",
        country: "Saudi Arabia",
        email: "info@company.com",
        phone: "+966 50 000 0000",
        logo: ""
      });
    }

    // Load invoice data (demo data for now)
    if (id) {
      setInvoice({
        id: id as string,
        invoiceNumber: `INV-2024-${String(id).padStart(5, "0")}`,
        date: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        customer: {
          name: "Sample Customer",
          nameAr: "عميل تجريبي",
          vatNumber: "300111222333444",
          crNumber: "1010111222",
          buildingNumber: "7890",
          streetName: "Olaya Street",
          additionalNumber: "1122",
          postalCode: "11564",
          city: "Riyadh",
          phone: "+966 55 555 5555",
          email: "customer@example.com"
        },
        items: [
          {
            itemCode: "PROD-001",
            description: "Product/Service 1",
            quantity: 2,
            unitPrice: 1000,
            discount: 100,
            vatRate: 15,
            amount: 2000
          },
          {
            itemCode: "PROD-002",
            description: "Product/Service 2",
            quantity: 1,
            unitPrice: 1500,
            discount: 0,
            vatRate: 15,
            amount: 1500
          }
        ],
        subtotal: 3500,
        totalVat: 525,
        total: 4025,
        notes: "Thank you for your business!",
        status: "paid"
      });
    }
  }, [id]);

  useEffect(() => {
    // Generate QR Code for ZATCA compliance
    if (invoice && companyInfo) {
      const qrData = generateZATCAQRCode(invoice, companyInfo);
      QRCode.toDataURL(qrData, { width: 200 })
        .then(setQrCode)
        .catch(console.error);
    }
  }, [invoice, companyInfo]);

  const generateZATCAQRCode = (invoice: InvoiceData, company: any) => {
    // ZATCA QR Code format (TLV encoding)
    const tlv = [
      { tag: 1, value: company.nameEn }, // Seller name
      { tag: 2, value: company.vatNumber }, // Seller VAT
      { tag: 3, value: invoice.date }, // Invoice date
      { tag: 4, value: invoice.total.toFixed(2) }, // Total with VAT
      { tag: 5, value: invoice.totalVat.toFixed(2) } // VAT amount
    ];

    return tlv.map(item => `${item.tag}:${item.value}`).join("|");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    try {
      // Show loading state
      const button = document.querySelector('[data-pdf-button]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Generating PDF...';
      }

      // Hide action buttons before capturing
      const actionButtons = document.querySelector('.no-print');
      if (actionButtons) {
        (actionButtons as HTMLElement).style.display = 'none';
      }

      // Capture the invoice content as canvas
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Show action buttons again
      if (actionButtons) {
        (actionButtons as HTMLElement).style.display = 'flex';
      }

      // Calculate PDF dimensions (A4 size)
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Save PDF with invoice number as filename
      pdf.save(`${invoice.invoiceNumber}_ZATCA_Invoice.pdf`);

      // Reset button state
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>Download PDF';
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
      
      // Reset button state on error
      const button = document.querySelector('[data-pdf-button]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>Download PDF';
      }
    }
  };

  if (!invoice || !companyInfo) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEO 
        title={`Invoice ${invoice.invoiceNumber}`}
        description="View and print invoice"
      />
      <DashboardLayout>
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="no-print flex items-center justify-between">
            <Link href="/sales">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sales
              </Button>
            </Link>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
              </Button>
              <Button onClick={handleDownloadPDF} data-pdf-button>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>

          {/* Invoice Template */}
          <Card className="p-8 print:p-0 print:shadow-none" ref={invoiceRef}>
            <div className="space-y-8">
              {/* Header */}
              <div className="flex justify-between items-start border-b pb-8">
                <div className="space-y-2">
                  {companyInfo.logo && (
                    <img src={companyInfo.logo} alt="Company Logo" className="h-16 mb-4" />
                  )}
                  <h1 className="text-3xl font-bold text-primary">{companyInfo.nameEn}</h1>
                  <p className="text-xl text-muted-foreground" dir="rtl">{companyInfo.nameAr}</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{companyInfo.buildingNumber} {companyInfo.streetName}, {companyInfo.additionalNumber}</p>
                    <p>{companyInfo.city} {companyInfo.postalCode}, {companyInfo.country}</p>
                    <p>Email: {companyInfo.email} | Phone: {companyInfo.phone}</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <h2 className="text-4xl font-bold">INVOICE</h2>
                  <p className="text-2xl font-semibold text-primary" dir="rtl">فاتورة ضريبية</p>
                  <div className="text-sm space-y-1 mt-4">
                    <p><span className="font-semibold">Invoice No:</span> {invoice.invoiceNumber}</p>
                    <p><span className="font-semibold">Date:</span> {new Date(invoice.date).toLocaleDateString()}</p>
                    <p><span className="font-semibold">Due Date:</span> {new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Company & Customer Details */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-primary">Seller Information / بيانات البائع</h3>
                  <div className="text-sm space-y-1 bg-muted/30 p-4 rounded">
                    <p><span className="font-semibold">VAT No / الرقم الضريبي:</span> {companyInfo.vatNumber}</p>
                    <p><span className="font-semibold">CR No / السجل التجاري:</span> {companyInfo.crNumber}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-primary">Bill To / الفاتورة إلى</h3>
                  <div className="text-sm space-y-1 bg-muted/30 p-4 rounded">
                    <p className="font-semibold text-base">{invoice.customer.name}</p>
                    {invoice.customer.nameAr && (
                      <p className="font-semibold" dir="rtl">{invoice.customer.nameAr}</p>
                    )}
                    {invoice.customer.vatNumber && (
                      <p><span className="font-semibold">VAT No:</span> {invoice.customer.vatNumber}</p>
                    )}
                    {invoice.customer.crNumber && (
                      <p><span className="font-semibold">CR No:</span> {invoice.customer.crNumber}</p>
                    )}
                    <p>{invoice.customer.buildingNumber} {invoice.customer.streetName}, {invoice.customer.additionalNumber}</p>
                    <p>{invoice.customer.city} {invoice.customer.postalCode}</p>
                    <p>{invoice.customer.email} | {invoice.customer.phone}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <table className="w-full">
                  <thead className="bg-primary text-primary-foreground">
                    <tr>
                      <th className="text-left p-3">#</th>
                      <th className="text-left p-3">Item Code<br/><span className="text-xs font-normal">رمز الصنف</span></th>
                      <th className="text-left p-3">Description<br/><span className="text-xs font-normal">الوصف</span></th>
                      <th className="text-center p-3">Qty<br/><span className="text-xs font-normal">الكمية</span></th>
                      <th className="text-right p-3">Unit Price<br/><span className="text-xs font-normal">سعر الوحدة</span></th>
                      <th className="text-right p-3">Discount<br/><span className="text-xs font-normal">الخصم</span></th>
                      <th className="text-right p-3">Subtotal<br/><span className="text-xs font-normal">المجموع الفرعي</span></th>
                      <th className="text-center p-3">VAT %<br/><span className="text-xs font-normal">ض.ق.م</span></th>
                      <th className="text-right p-3">Total Tax<br/><span className="text-xs font-normal">مجموع الضريبة</span></th>
                      <th className="text-right p-3">Amount<br/><span className="text-xs font-normal">المبلغ</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => {
                      const subtotal = (item.quantity * item.unitPrice) - (item.discount || 0);
                      const taxAmount = subtotal * (item.vatRate / 100);
                      return (
                        <tr key={index} className="border-b">
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3">{item.itemCode || '-'}</td>
                          <td className="p-3">{item.description}</td>
                          <td className="text-center p-3">{item.quantity}</td>
                          <td className="text-right p-3">{item.unitPrice.toFixed(2)} SAR</td>
                          <td className="text-right p-3">{item.discount ? `${item.discount.toFixed(2)} SAR` : '-'}</td>
                          <td className="text-right p-3 font-semibold">{subtotal.toFixed(2)} SAR</td>
                          <td className="text-center p-3">{item.vatRate}%</td>
                          <td className="text-right p-3 font-semibold">{taxAmount.toFixed(2)} SAR</td>
                          <td className="text-right p-3 font-semibold">{item.amount.toFixed(2)} SAR</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals & QR Code */}
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  {qrCode && (
                    <div className="border-2 border-primary p-4 rounded">
                      <img src={qrCode} alt="ZATCA QR Code" className="w-40 h-40" />
                      <p className="text-xs text-center mt-2 text-muted-foreground">Scan for verification</p>
                    </div>
                  )}
                </div>
                <div className="w-80 space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span>Subtotal (المجموع الفرعي):</span>
                    <span className="font-semibold">{invoice.subtotal.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>VAT 15% (ضريبة القيمة المضافة):</span>
                    <span className="font-semibold">{invoice.totalVat.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between py-3 bg-primary text-primary-foreground px-4 rounded text-lg">
                    <span className="font-bold">Total (الإجمالي):</span>
                    <span className="font-bold">{invoice.total.toFixed(2)} SAR</span>
                  </div>
                </div>
              </div>

              {/* Footer Notes */}
              {invoice.notes && (
                <div className="border-t pt-6">
                  <p className="text-sm text-muted-foreground"><span className="font-semibold">Notes:</span> {invoice.notes}</p>
                </div>
              )}

              {/* ZATCA Compliance Footer */}
              <div className="text-center text-xs text-muted-foreground border-t pt-4">
                <p>This is a tax invoice issued in accordance with Saudi ZATCA e-invoicing regulations</p>
                <p dir="rtl">هذه فاتورة ضريبية صادرة وفقاً لأنظمة الفوترة الإلكترونية السعودية</p>
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}