import * as activityLogService from './activityLog.service.js';

export async function listRecentHandler(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 50;
    const rows = await activityLogService.listRecent(limit);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}
