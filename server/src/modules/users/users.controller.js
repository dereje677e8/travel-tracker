import * as usersService from './users.service.js';

export async function listHandler(req, res, next) {
  try {
    res.json({ success: true, data: await usersService.list() });
  } catch (err) {
    next(err);
  }
}

export async function directoryHandler(req, res, next) {
  try {
    res.json({ success: true, data: await usersService.directory() });
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req, res, next) {
  try {
    const result = await usersService.create(req.body, req.user.id);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req, res, next) {
  try {
    await usersService.update(Number(req.params.id), req.body, req.user.id);
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    next(err);
  }
}
