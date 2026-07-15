import * as notificationsService from './notifications.service.js';

export async function sendHandler(req, res, next) {
  try {
    const result = await notificationsService.send(req.body, req.user.id);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function historyHandler(req, res, next) {
  try {
    const result = await notificationsService.history(Number(req.params.athleteId));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
