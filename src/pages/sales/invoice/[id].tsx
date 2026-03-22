import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, Download, ArrowLeft, DollarSign } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { salesService } from "@/services/salesService";
import { useToast } from "@/hooks/use-toast";
import { PaymentDialog } from "@/components/PaymentDialog";
import { generatePaymentReceipt, generateReceiptNumber } from "@/lib/paymentReceiptGenerator";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceData {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_name: string;
  customer_name_ar?: string;
  customer_vat?: string;
  customer_cr?: string;
  customer_building?: string;
  customer_street?: string;
  customer_additional?: string;
  customer_postal?: string;
  customer_city?: string;
  customer_phone?: string;
  customer_email?: string;
  items: Array<{
    product_code?: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
    tax_rate: number;
    line_total: number;
  }>;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  payment_status: string;
  paid_amount: number;
}

export default function InvoiceViewPage() {
  const router = useRouter();
  const { id } = router.query;
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

    // Load invoice data from database
    if (id) {
      loadInvoice(id as string);
    }
  }, [id]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      console.log("Loading invoice:", invoiceId);
      
      const { data, error } = await supabase
        .from("sales_invoices")
        .select(`
          *,
          items:sales_invoice_items(*)
        `)
        .eq("id", invoiceId)
        .single();

      if (error) {
        console.error("Error loading invoice:", error);
        toast({
          title: "Error",
          description: "Failed to load invoice details",
          variant: "destructive",
        });
        return;
      }

      console.log("Invoice loaded:", data);
      setInvoice(data as InvoiceData);
    } catch (error: any) {
      console.error("Error loading invoice:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      { tag: 3, value: invoice.invoice_date }, // Invoice date
      { tag: 4, value: parseFloat(invoice.total_amount as any).toFixed(2) }, // Total with VAT
      { tag: 5, value: parseFloat(invoice.tax_amount as any).toFixed(2) } // VAT amount
    ];

    return tlv.map(item => `${item.tag}:${item.value}`).join("|");
  };

  const handleRecordPayment = async (invoice: any, paymentAmount: number, paymentMethod: string, notes: string) => {
    try {
      const newPaidAmount = parseFloat(invoice.paid_amount || 0) + paymentAmount;
      const totalAmount = parseFloat(invoice.total_amount || 0);
      const newBalance = totalAmount - newPaidAmount;

      let newStatus = "unpaid";
      if (newBalance <= 0) {
        newStatus = "paid";
      } else if (newPaidAmount > 0) {
        newStatus = "pending";
      }

      const { error } = await supabase
        .from("sales_invoices")
        .update({
          paid_amount: newPaidAmount,
          payment_status: newStatus,
        })
        .eq("id", invoice.id);

      if (error) throw error;

      generatePaymentReceipt({
        receiptNumber: generateReceiptNumber(),
        paymentDate: new Date().toLocaleDateString(),
        invoiceNumber: invoice.invoice_number,
        customerName: invoice.customer_name,
        customerVat: invoice.customer_vat,
        paymentAmount: paymentAmount,
        paymentMethod: paymentMethod,
        previousBalance: totalAmount - parseFloat(invoice.paid_amount || 0),
        newBalance: newBalance,
        notes: notes,
        type: "sales",
      });

      toast({
        title: "Payment Recorded",
        description: `Payment of SAR ${paymentAmount.toFixed(2)} recorded successfully. Receipt downloaded.`,
      });

      setPaymentDialogOpen(false);
      loadInvoice(invoice.id);
    } catch (error: any) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    try {
      const button = document.querySelector('[data-pdf-button]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Generating PDF...';
      }

      const actionButtons = document.querySelector('.no-print');
      if (actionButtons) {
        (actionButtons as HTMLElement).style.display = 'none';
      }

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      if (actionButtons) {
        (actionButtons as HTMLElement).style.display = 'flex';
      }

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      pdf.save(`${invoice?.invoice_number}_ZATCA_Invoice.pdf`);

      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>Download PDF';
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
      
      const button = document.querySelector('[data-pdf-button]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>Download PDF';
      }
    }
  };

  if (loading || !invoice || !companyInfo) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading invoice...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEO 
        title={`Invoice ${invoice.invoice_number}`}
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
              {invoice.payment_status !== "paid" && parseFloat(invoice.total_amount as any) > parseFloat(invoice.paid_amount as any) && (
                <Button 
                  variant="default"
                  onClick={() => setPaymentDialogOpen(true)}
                  className="bg-success hover:bg-success/90"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              )}
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
                <div className="space-y-2">
                  <h2 className="text-4xl font-bold">INVOICE</h2>
                  <p className="text-2xl font-semibold text-primary" dir="rtl">فاتورة ضريبية</p>
                  <div className="text-sm space-y-1 mt-4">
                    <p><span className="font-semibold">Invoice No:</span> {invoice.invoice_number}</p>
                    <p><span className="font-semibold">Date:</span> {new Date(invoice.invoice_date).toLocaleDateString()}</p>
                    <p><span className="font-semibold">Due Date:</span> {new Date(invoice.due_date).toLocaleDateString()}</p>
                    <p><span className="font-semibold">Status:</span> <span className={`font-bold ${invoice.payment_status === 'paid' ? 'text-success' : invoice.payment_status === 'pending' ? 'text-warning' : 'text-destructive'}`}>{invoice.payment_status.toUpperCase()}</span></p>
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
                    <p className="font-semibold text-base">{invoice.customer_name}</p>
                    {invoice.customer_name_ar && (
                      <p className="font-semibold" dir="rtl">{invoice.customer_name_ar}</p>
                    )}
                    {invoice.customer_vat && (
                      <p><span className="font-semibold">VAT No:</span> {invoice.customer_vat}</p>
                    )}
                    {invoice.customer_cr && (
                      <p><span className="font-semibold">CR No:</span> {invoice.customer_cr}</p>
                    )}
                    {invoice.customer_building && invoice.customer_street && (
                      <p>{invoice.customer_building} {invoice.customer_street}, {invoice.customer_additional}</p>
                    )}
                    {invoice.customer_city && invoice.customer_postal && (
                      <p>{invoice.customer_city} {invoice.customer_postal}</p>
                    )}
                    {invoice.customer_email && invoice.customer_phone && (
                      <p>{invoice.customer_email} | {invoice.customer_phone}</p>
                    )}
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
                      const unitPrice = parseFloat(item.unit_price as any || 0);
                      const quantity = parseFloat(item.quantity as any || 0);
                      const discount = parseFloat(item.discount_amount as any || 0);
                      const subtotal = (quantity * unitPrice) - discount;
                      const vatRate = parseFloat(item.tax_rate as any || 0);
                      const taxAmount = subtotal * (vatRate / 100);
                      const totalAmount = parseFloat(item.line_total as any || 0);
                      
                      return (
                        <tr key={index} className="border-b">
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3">{item.product_code || '-'}</td>
                          <td className="p-3">{item.product_name || '-'}</td>
                          <td className="text-center p-3">{quantity}</td>
                          <td className="text-right p-3">{unitPrice.toFixed(2)} SAR</td>
                          <td className="text-right p-3">{discount ? `${discount.toFixed(2)} SAR` : '-'}</td>
                          <td className="text-right p-3 font-semibold">{subtotal.toFixed(2)} SAR</td>
                          <td className="text-center p-3">{vatRate}%</td>
                          <td className="text-right p-3 font-semibold">{taxAmount.toFixed(2)} SAR</td>
                          <td className="text-right p-3 font-semibold">{totalAmount.toFixed(2)} SAR</td>
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
                    <span className="font-semibold">{parseFloat(invoice.subtotal as any || 0).toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>VAT 15% (ضريبة القيمة المضافة):</span>
                    <span className="font-semibold">{parseFloat(invoice.tax_amount as any || 0).toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between py-3 bg-primary text-primary-foreground px-4 rounded text-lg">
                    <span className="font-bold">Total (الإجمالي):</span>
                    <span className="font-bold">{parseFloat(invoice.total_amount as any).toFixed(2)} SAR</span>
                  </div>
                  {parseFloat(invoice.paid_amount as any) > 0 && (
                    <>
                      <div className="flex justify-between py-2 border-b text-success">
                        <span className="font-semibold">Paid Amount (المبلغ المدفوع):</span>
                        <span className="font-semibold">{parseFloat(invoice.paid_amount as any).toFixed(2)} SAR</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="font-semibold">Balance Due (الرصيد المستحق):</span>
                        <span className={`font-semibold ${parseFloat(invoice.total_amount as any) - parseFloat(invoice.paid_amount as any) > 0 ? 'text-destructive' : 'text-success'}`}>
                          {(parseFloat(invoice.total_amount as any) - parseFloat(invoice.paid_amount as any)).toFixed(2)} SAR
                        </span>
                      </div>
                    </>
                  )}
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

        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          invoice={invoice}
          type="sales"
          onPaymentRecorded={handleRecordPayment}
        />
      </DashboardLayout>
    </>
  );
}