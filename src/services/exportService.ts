/**
 * Service d'export de données (CSV, Excel, PDF)
 */

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  columns?: string[];
}

/**
 * Exporte des données en CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): void {
  const { filename = 'export', includeHeaders = true, columns } = options;

  if (data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  // Déterminer les colonnes à exporter
  const keys = columns || Object.keys(data[0]);

  // Créer les lignes CSV
  const rows: string[] = [];

  // Headers
  if (includeHeaders) {
    rows.push(keys.map((key) => escapeCSV(key)).join(','));
  }

  // Data
  data.forEach((row) => {
    rows.push(
      keys
        .map((key) => {
          const value = row[key];
          if (value == null) return '';
          return escapeCSV(String(value));
        })
        .join(',')
    );
  });

  // Créer le blob et télécharger
  const csvContent = rows.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Exporte des données en Excel (format CSV avec extension .xlsx simulé)
 * Note: Pour un vrai export Excel, utiliser une bibliothèque comme xlsx
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): void {
  // Pour l'instant, on utilise CSV avec extension .xlsx
  // Dans un vrai projet, utiliser la bibliothèque 'xlsx'
  const { filename = 'export', ...restOptions } = options;
  exportToCSV(data, { ...restOptions, filename: filename.replace('.xlsx', '') });
  
  // Note: Pour un vrai export Excel, décommenter et installer 'xlsx':
  /*
  import * as XLSX from 'xlsx';
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
  */
}

/**
 * Exporte des données en PDF
 * Note: Nécessite une bibliothèque comme jsPDF ou pdfmake
 */
export function exportToPDF<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions & { title?: string } = {}
): void {
  const { filename = 'export', title = 'Export de données', includeHeaders = true, columns } = options;

  // Note: Pour un vrai export PDF, utiliser jsPDF ou pdfmake
  // Pour l'instant, on génère un CSV comme fallback
  console.warn('Export PDF non implémenté, utilisation de CSV comme fallback');
  exportToCSV(data, { filename, includeHeaders, columns });

  // Exemple avec jsPDF (nécessite installation: npm install jspdf jspdf-autotable):
  /*
  import jsPDF from 'jspdf';
  import 'jspdf-autotable';
  
  const doc = new jsPDF();
  doc.text(title, 14, 16);
  
  const keys = columns || Object.keys(data[0]);
  const tableData = data.map(row => keys.map(key => row[key] || ''));
  
  (doc as any).autoTable({
    head: includeHeaders ? [keys] : [],
    body: tableData,
    startY: 20,
  });
  
  doc.save(`${filename}.pdf`);
  */
}

/**
 * Échappe une valeur pour CSV
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Exporte avec format automatique basé sur l'extension
 */
export function exportData<T extends Record<string, any>>(
  data: T[],
  format: ExportFormat,
  options: ExportOptions = {}
): void {
  switch (format) {
    case 'csv':
      exportToCSV(data, options);
      break;
    case 'excel':
      exportToExcel(data, options);
      break;
    case 'pdf':
      exportToPDF(data, options);
      break;
    default:
      throw new Error(`Format d'export non supporté: ${format}`);
  }
}

