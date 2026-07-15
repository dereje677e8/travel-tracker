import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { pool } from '../../db/pool.js';
import { REQUIRED_ITEMS, STATUS_LABELS } from '../../utils/progress.js';

async function fetchReportRows(filters) {
  const where = ['a.deleted_at IS NULL'];
  const params = [];
  if (filters.status) { where.push('a.status = ?'); params.push(filters.status); }
  if (filters.destinationCountry) { where.push('a.destination_country = ?'); params.push(filters.destinationCountry); }

  const [rows] = await pool.query(
    `SELECT a.id, a.full_name, a.sport, a.competition_name, a.destination_country,
            a.departure_date, a.return_date, a.progress_percent, a.status
     FROM athletes a
     WHERE ${where.join(' AND ')}
     ORDER BY a.departure_date ASC`,
    params
  );

  // Attach missing-requirement labels per athlete for the report's "Missing Requirements" column.
  const [allReqs] = await pool.query(
    `SELECT athlete_id, requirement_key FROM travel_requirements WHERE status = 'pending'`
  );
  const missingByAthlete = {};
  for (const r of allReqs) {
    (missingByAthlete[r.athlete_id] ||= []).push(r.requirement_key.replace(/_/g, ' '));
  }

  return rows.map((r) => ({
    ...r,
    statusLabel: STATUS_LABELS[r.status] || r.status,
    missingRequirements: (missingByAthlete[r.id] || []).join(', ') || 'None',
  }));
}

export async function buildExcelReport(filters) {
  const rows = await fetchReportRows(filters);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Travel Report');

  sheet.columns = [
    { header: 'Athlete Name', key: 'full_name', width: 24 },
    { header: 'Sport', key: 'sport', width: 16 },
    { header: 'Competition', key: 'competition_name', width: 28 },
    { header: 'Destination', key: 'destination_country', width: 16 },
    { header: 'Departure Date', key: 'departure_date', width: 16 },
    { header: 'Return Date', key: 'return_date', width: 16 },
    { header: 'Progress', key: 'progress_percent', width: 10 },
    { header: 'Status', key: 'statusLabel', width: 20 },
    { header: 'Missing Requirements', key: 'missingRequirements', width: 40 },
  ];
  sheet.getRow(1).font = { bold: true };
  rows.forEach((r) => sheet.addRow(r));

  return workbook.xlsx.writeBuffer();
}

export async function buildPdfReport(filters) {
  const rows = await fetchReportRows(filters);
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  doc.fontSize(16).text('Athlete Travel Report', { align: 'left' });
  doc.fontSize(9).fillColor('#555').text(`Generated ${new Date().toISOString().slice(0, 10)}`, { align: 'left' });
  doc.moveDown();

  const headers = ['Name', 'Sport', 'Competition', 'Destination', 'Departure', 'Return', 'Progress', 'Status', 'Missing'];
  const colWidths = [90, 60, 110, 70, 60, 60, 45, 80, 160];

  function drawRow(values, y, bold = false) {
    let x = doc.page.margins.left;
    doc.fontSize(8).fillColor('#000').font(bold ? 'Helvetica-Bold' : 'Helvetica');
    values.forEach((val, i) => {
      doc.text(String(val ?? ''), x, y, { width: colWidths[i], ellipsis: true });
      x += colWidths[i];
    });
  }

  let y = doc.y;
  drawRow(headers, y, true);
  y += 16;

  for (const r of rows) {
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = doc.page.margins.top;
      drawRow(headers, y, true);
      y += 16;
    }
    drawRow([
      r.full_name, r.sport, r.competition_name, r.destination_country,
      r.departure_date, r.return_date, `${r.progress_percent}%`, r.statusLabel, r.missingRequirements,
    ], y);
    y += 16;
  }

  doc.end();
  return done;
}
