import * as calendarService from './calendar.service.js';

export async function eventsHandler(req, res, next) {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'start and end query params (YYYY-MM-DD) are required' } });
    }
    res.json({ success: true, data: await calendarService.getEvents({ start, end }) });
  } catch (err) {
    next(err);
  }
}
