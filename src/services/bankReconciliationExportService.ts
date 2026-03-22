import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { BankAccountWithBalance, BankTransactionWithMatching } from "./bankReconciliationService";

interface ReconciliationSummary {
  bankBalance: number;
  bookBalance: number;
  difference: number;
  matchedCount: number;
  unmatchedCount: number;
  reconciledCount: number;
}

interface ExportOptions {
  accountName: string;
  accountNumber: string;
  bankName: string;
  dateRange: {
    start: string;
    end: string;
  };
  transactions: BankTransactionWithMatching[];
  summary: ReconciliationSummary;
  companyName?: string;
}

export const bankReconciliationExportService = {
  // Export to PDF
  exportToPDF(options: ExportOptions) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;

    // Company Name
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(options.companyName || "Company Name", pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    // Report Title
    doc.setFontSize(16);
    doc.text("Bank Reconciliation Report", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Account Information
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Bank: ${options.bankName}`, 15, yPos);
    yPos += 6;
    doc.text(`Account: ${options.accountName} (${options.accountNumber})`, 15, yPos);
    yPos += 6;
    doc.text(`Period: ${options.dateRange.start} to ${options.dateRange.end}`, 15, yPos);
    yPos += 6;
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 15, yPos);
    yPos += 12;

    // Reconciliation Summary
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos, pageWidth - 30, 40, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Reconciliation Summary", 20, yPos + 8);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    yPos += 16;
    
    doc.text(`Bank Balance:`, 20, yPos);
    doc.text(`SAR ${options.summary.bankBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 100, yPos);
    yPos += 6;
    
    doc.text(`Book Balance:`, 20, yPos);
    doc.text(`SAR ${options.summary.bookBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 100, yPos);
    yPos += 6;
    
    doc.text(`Difference:`, 20, yPos);
    const diffColor = Math.abs(options.summary.difference) < 0.01 ? [0, 128, 0] : [255, 140, 0];
    doc.setTextColor(diffColor[0], diffColor[1], diffColor[2]);
    doc.text(`SAR ${options.summary.difference.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 100, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 6;
    
    doc.text(`Matched Transactions:`, 20, yPos);
    doc.text(`${options.summary.matchedCount}`, 100, yPos);
    yPos += 6;
    
    doc.text(`Unmatched Transactions:`, 20, yPos);
    doc.text(`${options.summary.unmatchedCount}`, 100, yPos);
    yPos += 15;

    // Transaction Details Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Transaction Details", 15, yPos);
    yPos += 8;

    const tableData = options.transactions.map(t => [
      new Date(t.transaction_date).toLocaleDateString(),
      t.description || "",
      t.reference_number || "-",
      t.transaction_type === "debit" ? `SAR ${t.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "-",
      t.transaction_type === "credit" ? `SAR ${t.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "-",
      `SAR ${(t.balance_after || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      t.is_matched ? "Matched" : t.reconciled ? "Reconciled" : "Unmatched",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Date", "Description", "Reference", "Debit", "Credit", "Balance", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 50 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25, halign: "right" },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 25, halign: "right" },
        6: { cellWidth: 20, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.row.index >= 0 && data.column.index === 6) {
          const status = data.cell.text[0];
          if (status === "Matched" || status === "Reconciled") {
            data.cell.styles.textColor = [0, 128, 0];
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.textColor = [255, 140, 0];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );

    // Add page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 20,
        doc.internal.pageSize.height - 10,
        { align: "right" }
      );
    }

    // Save PDF
    const fileName = `Bank_Reconciliation_${options.accountNumber}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  },

  // Export to Excel
  exportToExcel(options: ExportOptions) {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["BANK RECONCILIATION REPORT"],
      [],
      ["Bank:", options.bankName],
      ["Account:", `${options.accountName} (${options.accountNumber})`],
      ["Period:", `${options.dateRange.start} to ${options.dateRange.end}`],
      ["Report Date:", new Date().toLocaleDateString()],
      [],
      ["RECONCILIATION SUMMARY"],
      ["Bank Balance", `SAR ${options.summary.bankBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
      ["Book Balance", `SAR ${options.summary.bookBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
      ["Difference", `SAR ${options.summary.difference.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
      [],
      ["Matched Transactions", options.summary.matchedCount],
      ["Unmatched Transactions", options.summary.unmatchedCount],
      ["Reconciled Transactions", options.summary.reconciledCount],
      [],
      ["Status", Math.abs(options.summary.difference) < 0.01 ? "BALANCED ✓" : "UNBALANCED - REVIEW REQUIRED"],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    summarySheet["!cols"] = [{ wch: 30 }, { wch: 40 }];

    // Transactions Sheet
    const transactionsData = [
      ["Date", "Description", "Reference", "Debit", "Credit", "Balance", "Status", "Category", "Matched With"],
    ];

    options.transactions.forEach(t => {
      transactionsData.push([
        new Date(t.transaction_date).toLocaleDateString(),
        t.description || "",
        t.reference_number || "",
        t.transaction_type === "debit" ? t.amount : "",
        t.transaction_type === "credit" ? t.amount : "",
        t.balance_after || 0,
        t.is_matched ? "Matched" : t.reconciled ? "Reconciled" : "Unmatched",
        t.category || "",
        t.matched_transaction_id || "",
      ]);
    });

    const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
    
    // Set column widths
    transactionsSheet["!cols"] = [
      { wch: 12 }, // Date
      { wch: 40 }, // Description
      { wch: 15 }, // Reference
      { wch: 15 }, // Debit
      { wch: 15 }, // Credit
      { wch: 15 }, // Balance
      { wch: 12 }, // Status
      { wch: 15 }, // Category
      { wch: 20 }, // Matched With
    ];

    // Matched Transactions Sheet
    const matchedData = [["Date", "Description", "Reference", "Amount", "Balance", "Matched Journal Entry"]];
    
    options.transactions
      .filter(t => t.is_matched)
      .forEach(t => {
        matchedData.push([
          new Date(t.transaction_date).toLocaleDateString(),
          t.description || "",
          t.reference_number || "",
          t.amount,
          t.balance_after || 0,
          t.matched_transaction_id || "",
        ]);
      });

    const matchedSheet = XLSX.utils.aoa_to_sheet(matchedData);
    matchedSheet["!cols"] = [
      { wch: 12 },
      { wch: 40 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
    ];

    // Unmatched Transactions Sheet
    const unmatchedData = [["Date", "Description", "Reference", "Debit", "Credit", "Balance", "Category"]];
    
    options.transactions
      .filter(t => !t.is_matched && !t.reconciled)
      .forEach(t => {
        unmatchedData.push([
          new Date(t.transaction_date).toLocaleDateString(),
          t.description || "",
          t.reference_number || "",
          t.transaction_type === "debit" ? t.amount : "",
          t.transaction_type === "credit" ? t.amount : "",
          t.balance_after || 0,
          t.category || "",
        ]);
      });

    const unmatchedSheet = XLSX.utils.aoa_to_sheet(unmatchedData);
    unmatchedSheet["!cols"] = [
      { wch: 12 },
      { wch: 40 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    // Add sheets to workbook
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, "All Transactions");
    XLSX.utils.book_append_sheet(workbook, matchedSheet, "Matched");
    XLSX.utils.book_append_sheet(workbook, unmatchedSheet, "Unmatched");

    // Save Excel file
    const fileName = `Bank_Reconciliation_${options.accountNumber}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },
};