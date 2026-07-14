/**
 * 2차원 배열을 CSV 문자열로 변환한다. 엑셀 호환을 위해 BOM을 포함한다.
 */
export function toCsvString(rows: (string | number)[][]): string {
  const escapeCell = (cell: string | number): string => {
    const str = String(cell);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const body = rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
  return `\uFEFF${body}`;
}

/**
 * CSV 문자열을 파일로 다운로드한다. (브라우저 환경 전용)
 */
export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const csv = toCsvString(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
