import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, withTransaction } from '../../db/pool.js';
import { AppError } from '../../utils/AppError.js';
import { calculateProgress, deriveStatus } from '../../utils/progress.js';
import * as repo from './athlete.repository.js';
import * as activityLogService from '../activityLog/activityLog.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../../uploads/athlete-photos');

export async function listAthletes(query) {
  return repo.list(query);
}

export async function getAthleteDetail(id) {
  const athlete = await repo.findById(id);
  if (!athlete) throw AppError.notFound('Athlete not found');
  const requirements = await repo.findRequirements(id);
  const activity = await activityLogService.listForEntity('athlete', id);

  const daysUntilDeparture = Math.ceil(
    (new Date(athlete.departure_date) - new Date(new Date().toDateString())) / 86400000
  );

  return { athlete, requirements, activity, daysUntilDeparture };
}

export async function createAthlete(data, actorId, io) {
  return withTransaction(async (conn) => {
    const code = await repo.generateAthleteCode(conn);
    const athleteId = await repo.insertAthlete(conn, code, data, actorId);
    await repo.insertBlankRequirements(conn, athleteId);
    await activityLogService.record(conn, {
      userId: actorId, action: 'athlete.created', entityType: 'athlete', entityId: athleteId,
      details: { athleteCode: code, fullName: data.fullName },
    });
    io?.emit('athlete:created', { id: athleteId, athleteCode: code });
    return { id: athleteId, athleteCode: code };
  });
}

export async function updateAthlete(id, patch, actorId, io) {
  return withTransaction(async (conn) => {
    const existing = await repo.findById(id);
    if (!existing) throw AppError.notFound('Athlete not found');
    await repo.updateAthleteFields(conn, id, patch);
    await activityLogService.record(conn, {
      userId: actorId, action: 'athlete.updated', entityType: 'athlete', entityId: id, details: patch,
    });
    io?.emit('athlete:updated', { id });
  });
}

export async function deleteAthlete(id, actorId, io) {
  return withTransaction(async (conn) => {
    const existing = await repo.findById(id);
    if (!existing) throw AppError.notFound('Athlete not found');
    await repo.softDelete(conn, id);
    await activityLogService.record(conn, {
      userId: actorId, action: 'athlete.deleted', entityType: 'athlete', entityId: id, details: {},
    });
    io?.emit('athlete:deleted', { id });
  });
}

export async function updateRequirement(athleteId, requirementKey, patch, actorId, io) {
  return withTransaction(async (conn) => {
    const athlete = await repo.findById(athleteId);
    if (!athlete) throw AppError.notFound('Athlete not found');
    const requirement = await repo.getRequirement(athleteId, requirementKey);
    if (!requirement) throw AppError.notFound('Requirement not found for this athlete');

    await repo.updateRequirementRow(conn, athleteId, requirementKey, patch, actorId);

    const allRequirements = await repo.findRequirements(athleteId);
    const updated = allRequirements.map((r) =>
      r.requirement_key === requirementKey ? { ...r, status: patch.status } : r
    );
    const { percent } = calculateProgress(updated);
    const status = deriveStatus(percent);
    await repo.updateProgress(conn, athleteId, percent, status);

    await activityLogService.record(conn, {
      userId: actorId,
      action: patch.status === 'completed' ? 'requirement.completed' : 'requirement.reopened',
      entityType: 'athlete',
      entityId: athleteId,
      details: { requirementKey, status: patch.status },
    });

    io?.emit('requirement:updated', { athleteId, requirementKey, status: patch.status, progressPercent: percent, athleteStatus: status });

    return { progressPercent: percent, status };
  });
}

export async function distinctDestinations() {
  const [rows] = await pool.query(
    'SELECT destination_country, COUNT(*) AS count FROM athletes WHERE deleted_at IS NULL GROUP BY destination_country ORDER BY count DESC'
  );
  return rows;
}

export async function uploadPhoto(athleteId, file, actorId, io) {
  const athlete = await repo.findById(athleteId);
  if (!athlete) throw AppError.notFound('Athlete not found');

  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  // Fixed filename per athlete (not per upload) so replacing a photo
  // overwrites in place - no orphaned old files accumulating on disk.
  const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
  const filename = `${athleteId}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  // Clean up a stale file with the other extension (e.g. athlete previously
  // uploaded a PNG, now uploads a JPEG) so we don't serve two versions.
  const otherExt = ext === 'jpg' ? 'png' : 'jpg';
  await fs.rm(path.join(UPLOADS_DIR, `${athleteId}.${otherExt}`), { force: true });

  await fs.writeFile(filePath, file.buffer);

  const relativePath = `athlete-photos/${filename}`;
  await repo.updatePhotoPath(athleteId, relativePath);

  await activityLogService.record(null, {
    userId: actorId, action: 'athlete.photo_updated', entityType: 'athlete', entityId: athleteId, details: {},
  });

  io?.emit('athlete:updated', { id: athleteId });

  return { photoPath: relativePath };
}

export async function getPhotoFile(athleteId) {
  const athlete = await repo.findById(athleteId);
  if (!athlete || !athlete.photo_path) throw AppError.notFound('No photo on file for this athlete');
  const absolutePath = path.join(UPLOADS_DIR, path.basename(athlete.photo_path));
  const mimeType = athlete.photo_path.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return { absolutePath, mimeType };
}
