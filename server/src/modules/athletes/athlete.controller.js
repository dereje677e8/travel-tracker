import * as athleteService from './athlete.service.js';

export async function listHandler(req, res, next) {
  try {
    const result = await athleteService.listAthletes(req.query);
    res.json({ success: true, data: result.rows, meta: { total: result.total, page: result.page, limit: result.limit } });
  } catch (err) {
    next(err);
  }
}

export async function detailHandler(req, res, next) {
  try {
    const result = await athleteService.getAthleteDetail(Number(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req, res, next) {
  try {
    const io = req.app.get('io');
    const result = await athleteService.createAthlete(req.body, req.user.id, io);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req, res, next) {
  try {
    const io = req.app.get('io');
    await athleteService.updateAthlete(Number(req.params.id), req.body, req.user.id, io);
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(req, res, next) {
  try {
    const io = req.app.get('io');
    await athleteService.deleteAthlete(Number(req.params.id), req.user.id, io);
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    next(err);
  }
}

export async function updateRequirementHandler(req, res, next) {
  try {
    const io = req.app.get('io');
    const result = await athleteService.updateRequirement(
      Number(req.params.id), req.params.requirementKey, req.body, req.user.id, io
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function destinationsHandler(req, res, next) {
  try {
    res.json({ success: true, data: await athleteService.distinctDestinations() });
  } catch (err) {
    next(err);
  }
}
