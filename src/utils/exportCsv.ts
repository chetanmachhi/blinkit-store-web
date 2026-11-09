import Papa from "papaparse";

export const downloadCsv = (data: any[], filename: string): void => {
  if (!data || data.length === 0) return;

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCsv = (filename: string, data: any[]): void => {
  downloadCsv(data, filename);
};
