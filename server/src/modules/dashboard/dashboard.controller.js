import * as dashboardService from './dashboard.service.js';

export async function summaryHandler(req, res, next) {
  try {
    res.json({ success: true, data: await dashboardService.getSummary() });
  } catch (err) {
    next(err);
  }
}
