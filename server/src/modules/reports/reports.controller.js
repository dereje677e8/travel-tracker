import * as reportsService from './reports.service.js';

export async function excelHandler(req, res, next) {
  try {
    const buffer = await reportsService.buildExcelReport(req.query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="travel-report.xlsx"');
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
}

export async function pdfHandler(req, res, next) {
  try {
    const buffer = await reportsService.buildPdfReport(req.query);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="travel-report.pdf"');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}
