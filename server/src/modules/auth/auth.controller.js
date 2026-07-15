import * as authService from './auth.service.js';

export async function loginHandler(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(req, res, next) {
  try {
    const result = await authService.refresh(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function meHandler(req, res, next) {
  try {
    const result = await authService.me(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
