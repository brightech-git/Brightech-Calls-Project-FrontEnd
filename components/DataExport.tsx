"use client";

/**
 * DataExport.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * A single, config-driven component that exports data to Excel, PDF, and Print.
 * Designed to be used on any page that needs to export tabular data.
 *
 * Features:
 *  - Export to Excel (.xlsx)
 *  - Export to PDF (with jspdf-autotable)
 *  - Print-friendly view (opens print dialog)
 *  - Fully customisable: title, header colors, border, font size, etc.
 *  - Works with any data shape via column definitions
 *  - Optional custom rendering for display and separate export values
 *
 * Usage:
 *   <DataExport
 *     data={myData}
 *     columns={[
 *       { key: "name", label: "Name" },
 *       { key: "age", label: "Age", exportValue: (val) => `${val} years` },
 *       { key: "status", label: "Status", render: (val) => <Badge>{val}</Badge> }
 *     ]}
 *     title="User Report"
 *     headerBg="#4f8ef7"
 *     headerColor="#ffffff"
 *   />
 */

import {
  Box,
  Button,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { useToast } from "@/components/Toast";
import { Download, FileSpreadsheet, Printer, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ExportColumn<T = any> {
  /** The key in the data object (used to extract raw value) */
  key: string;
  /** Column header label */
  label: string;
  /** Optional custom React render for on‑screen display (not used in exports) */
  render?: (value: any, row: T, index: number) => React.ReactNode;
  /** Optional formatter for export (Excel, PDF, Print). If not provided, falls back to row[key] */
  exportValue?: (value: any, row: T) => string | number;
  /** Column width hint for PDF (in mm) */
  pdfWidth?: number;
}

export interface DataExportProps<T = any> {
  /** Array of data to export */
  data: T[];
  /** Column definitions */
  columns: ExportColumn<T>[];
  /** Optional title (appears in PDF and Print header) */
  title?: string;
  /** Base filename (without extension) – default "export" */
  filename?: string;
  /** Background color of table header (any valid CSS color) – default "#4f8ef7" */
  headerBg?: string;
  /** Text color of table header – default "#ffffff" */
  headerColor?: string;
  /** Border color of table cells – default "#d1d5db" */
  borderColor?: string;
  /** Font size for table cells (in px) – default 12 */
  fontSize?: number;
  /** Which export buttons to show – default ["excel","pdf","print"] */
  showButtons?: ("excel" | "pdf" | "print")[];
  /** Size of the buttons – default "sm" */
  buttonSize?: string;
  /** Additional PDF options */
  pdfOptions?: {
    orientation?: "portrait" | "landscape";
    unit?: "mm" | "pt" | "px";
    format?: "a4" | "a3" | "letter" | "legal";
  };
  /** Additional Excel options */
  excelOptions?: {
    sheetName?: string;
  };
  /** Additional Print options */
  printOptions?: {
    pageTitle?: string;
  };
  /** Optional custom styling for the print window */
  printStyles?: string;
}

// ─── Helper: extract value for export (string or number) ──────────────────

function getExportValue<T>(
  row: T,
  column: ExportColumn<T>
): string | number {
  const rawValue = (row as any)[column.key];
  if (column.exportValue) {
    return column.exportValue(rawValue, row);
  }
  // Convert null/undefined to empty string
  if (rawValue == null) return "";
  if (typeof rawValue === "object") return JSON.stringify(rawValue);
  return String(rawValue);
}

// ─── Excel Export ─────────────────────────────────────────────────────────

function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  title: string | undefined,
  filename: string,
  sheetName: string
) {
  // Build a flat array of rows for Excel
  const sheetData = [
    // Header row
    columns.map((col) => col.label),
    // Data rows
    ...data.map((row) =>
      columns.map((col) => getExportValue(row, col))
    ),
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  // Auto-size columns (basic)
  ws["!cols"] = columns.map(() => ({ wch: 15 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, `${filename}.xlsx`);
}

// ─── PDF Export ────────────────────────────────────────────────────────────

function exportToPDF<T>(
  data: T[],
  columns: ExportColumn<T>[],
  title: string | undefined,
  filename: string,
  pdfOptions: Required<DataExportProps>["pdfOptions"],
  headerBg: string,
  headerColor: string,
  borderColor: string,
  fontSize: number
) {
  const orientation = pdfOptions?.orientation || "landscape";
  const unit = pdfOptions?.unit || "mm";
  const format = pdfOptions?.format || "a4";

  const doc = new jsPDF({ orientation, unit, format });
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftMargin = 14;

  // ── Luxury header band ──
  doc.setFillColor(...hexToRgb("#111827"));
  doc.rect(0, 0, pageWidth, 22, "F");

  // Company / report title
  if (title) {
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), leftMargin, 14);
  }

  // Date stamp top-right
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text(dateStr, pageWidth - leftMargin, 14, { align: "right" });

  // Thin gold accent line
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.6);
  doc.line(0, 22, pageWidth, 22);

  const tableHeaders = columns.map((col) => col.label);
  const tableData = data.map((row) => columns.map((col) => getExportValue(row, col)));

  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 28,
    theme: "grid",
    headStyles: {
      fillColor: hexToRgb("#1f2937"),
      textColor: [255, 255, 255],
      fontSize: fontSize - 1,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: fontSize - 1,
      textColor: hexToRgb("#111827"),
      cellPadding: 3.5,
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: columns.reduce((acc, col, idx) => {
      if (col.pdfWidth) acc[idx] = { cellWidth: col.pdfWidth };
      return acc;
    }, {} as Record<number, { cellWidth: number }>),
    margin: { left: leftMargin, right: leftMargin },
    // Footer with page numbers
    didDrawPage: (d) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Page ${(d.pageNumber)} — Generated on ${dateStr}`,
        pageWidth / 2, pageHeight - 6, { align: "center" }
      );
      // bottom gold line
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.4);
      doc.line(leftMargin, pageHeight - 10, pageWidth - leftMargin, pageHeight - 10);
    },
  });

  doc.save(`${filename}.pdf`);
}

// Helper: convert CSS hex color to RGB array (for jspdf)
function hexToRgb(hex: string): [number, number, number] {
  // Expand shorthand
  let hexSanitized = hex.replace(/^#/, "");
  if (hexSanitized.length === 3) {
    hexSanitized = hexSanitized
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const intVal = parseInt(hexSanitized, 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return [r, g, b];
}

// ─── Print Export (opens print dialog) ─────────────────────────────────────

function exportToPrint<T>(
  data: T[],
  columns: ExportColumn<T>[],
  title: string | undefined,
  headerBg: string,
  headerColor: string,
  borderColor: string,
  fontSize: number,
  printOptions: DataExportProps["printOptions"],
  customStyles?: string
) {
  // Build a printable HTML document
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow pop-ups to print.");
    return;
  }

  const pageTitle = printOptions?.pageTitle || title || "Exported Data";
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const headerRowHtml = columns
    .map((col) => `<th>${escapeHtml(col.label)}</th>`)
    .join("");

  const bodyRowsHtml = data
    .map((row, i) =>
      `<tr class="${i % 2 === 0 ? "even" : "odd"}">${columns
        .map((col) => `<td>${escapeHtml(String(getExportValue(row, col)))}</td>`)
        .join("")}</tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(pageTitle)}</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          body { font-family: 'Inter', sans-serif; background: #fff; color: #111827; padding: 32px 40px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

          .report-header {
            background: #111827 !important;
            color: #fff !important;
            padding: 20px 28px;
            border-radius: 10px 10px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .report-header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: #fff !important;
          }
          .report-header .date {
            font-size: 11px;
            color: #9ca3af !important;
            font-style: italic;
          }
          .gold-line {
            height: 3px;
            background: linear-gradient(90deg, #d4af37, #f5e27a, #d4af37) !important;
            margin-bottom: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .report-meta {
            background: #f9fafb !important;
            border: 1px solid #e5e7eb;
            border-top: none;
            padding: 10px 28px;
            font-size: 11px;
            color: #6b7280 !important;
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: ${fontSize}px;
          }
          thead tr {
            background: #1f2937 !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          thead th {
            padding: 11px 14px;
            text-align: left;
            font-family: 'Inter', sans-serif;
            font-size: ${fontSize - 1}px;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            border: none;
            color: #fff !important;
            background: #1f2937 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          tbody td {
            padding: 9px 14px;
            border-bottom: 1px solid #f3f4f6;
            font-size: ${fontSize}px;
            color: #374151 !important;
          }
          tr.even td { background: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          tr.odd  td { background: #f9fafb !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          tbody tr:last-child td { border-bottom: none; }
          .report-footer {
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #9ca3af !important;
            font-style: italic;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
          }
          @media print {
            body { padding: 16px 20px; }
            table { font-size: ${fontSize - 1}px; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          }
          ${customStyles || ""}
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>${escapeHtml(pageTitle)}</h1>
          <span class="date">Generated: ${dateStr}</span>
        </div>
        <div class="gold-line"></div>
        <div class="report-meta">
          <span>Total Records: <strong>${data.length}</strong></span>
          <span>Brightech Software &amp; Services</span>
        </div>
        <table>
          <thead><tr>${headerRowHtml}</tr></thead>
          <tbody>${bodyRowsHtml}</tbody>
        </table>
        <div class="report-footer">Confidential &mdash; For internal use only</div>
        <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };<\/script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

// Simple HTML escape to avoid injection
function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Main Component ────────────────────────────────────────────────────────

export function DataExport<T = any>({
  data,
  columns,
  title,
  filename = "export",
  headerBg = "#4f8ef7",
  headerColor = "#ffffff",
  borderColor = "#d1d5db",
  fontSize = 12,
  showButtons = ["excel", "pdf", "print"],
  buttonSize = "sm",
  pdfOptions = { orientation: "landscape", unit: "mm", format: "a4" },
  excelOptions = { sheetName: "Sheet1" },
  printOptions = {},
  printStyles,
}: DataExportProps<T>) {
  const toast = useToast();

  const handleExcel = () => {
    try {
      exportToExcel(data, columns, title, filename, excelOptions?.sheetName || "Data");
      toast.success("Export Successful", "Excel file has been downloaded.");
    } catch (error) {
      console.error(error);
      toast.error("Export Failed", "Could not generate Excel file.");
    }
  };

  const handlePDF = () => {
    try {
      exportToPDF(data, columns, title, filename, pdfOptions, headerBg, headerColor, borderColor, fontSize);
      toast.success("Export Successful", "PDF file has been downloaded.");
    } catch (error) {
      console.error(error);
      toast.error("Export Failed", "Could not generate PDF file.");
    }
  };

  const handlePrint = () => {
    try {
      exportToPrint(data, columns, title, headerBg, headerColor, borderColor, fontSize, printOptions, printStyles);
    } catch (error) {
      console.error(error);
      toast.error("Print Failed", "Could not open print dialog.");
    }
  };

  // If no data or columns, show disabled message
  const isDisabled = !data || data.length === 0 || !columns || columns.length === 0;

  return (
    <Box>
      <HStack gap={3} wrap="wrap">
        {showButtons.includes("excel") && (
          <Button
            size={buttonSize as any}
            onClick={handleExcel}
            disabled={isDisabled}
            bg="green.500"
            color="white"
            _hover={{ bg: "green.600" }}
          >
            <Icon as={FileSpreadsheet} boxSize="14px" /> Excel
          </Button>
        )}
        {showButtons.includes("pdf") && (
          <Button
            size={buttonSize as any}
            onClick={handlePDF}
            disabled={isDisabled}
            bg="red.500"
            color="white"
            _hover={{ bg: "red.600" }}
          >
            <Icon as={FileText} boxSize="14px" /> PDF
          </Button>
        )}
        {showButtons.includes("print") && (
          <Button
            size={buttonSize as any}
            onClick={handlePrint}
            disabled={isDisabled}
            bg="gray.600"
            color="white"
            _hover={{ bg: "gray.700" }}
          >
            <Icon as={Printer} boxSize="14px" /> Print
          </Button>
        )}
      </HStack>
    </Box>
  );
}