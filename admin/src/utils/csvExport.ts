/**
 * RFC 4180 compliant CSV exporter for Admin Portal tables & analytics
 */
export const exportToCSV = (data: any[], filenamePrefix: string = 'export') => {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Extract column keys
  const headers = Object.keys(data[0]);

  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      let val = row[header];
      if (val === null || val === undefined) {
        return '""';
      }
      if (typeof val === 'object') {
        if (val instanceof Date) {
          val = val.toISOString();
        } else {
          val = JSON.stringify(val);
        }
      }
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

