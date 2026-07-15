import { z } from 'zod';

// Base object schema (kept separate from .refine()) so both the full input
// schema and the partial patch schema can be derived from the same fields -
// z.object.partial() exists, but ZodEffects (the result of .refine()) has no
// .partial(), so the cross-field date check is layered on afterwards.
const athleteBaseSchema = z.object({
  fullName: z.string().min(2).max(150),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  passportNumber: z.string().min(4).max(50),
  sport: z.string().min(2).max(100),
  teamFederation: z.string().max(150).optional().nullable(),
  destinationCountry: z.string().min(2).max(100),
  destinationCity: z.string().max(100).optional().nullable(),
  competitionName: z.string().min(2).max(200),
  purposeOfTravel: z.string().max(200).optional().nullable(),
  visaType: z.string().max(100).optional().nullable(),
  embassy: z.string().max(150).optional().nullable(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  assignedOfficerId: z.number().int().positive().optional().nullable(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  notes: z.string().max(2000).optional().nullable(),
});

export const athleteInputSchema = athleteBaseSchema.refine(
  (data) => data.returnDate >= data.departureDate,
  { message: 'Return date must be on or after the departure date', path: ['returnDate'] }
);

export const athletePatchSchema = athleteBaseSchema.partial().refine(
  (data) => !data.returnDate || !data.departureDate || data.returnDate >= data.departureDate,
  { message: 'Return date must be on or after the departure date', path: ['returnDate'] }
);

export const requirementUpdateSchema = z.object({
  status: z.enum(['pending', 'completed']),
  dateCompleted: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  status: z.string().optional(),
  destinationCountry: z.string().optional(),
  missing: z.string().optional(), // requirement_key of a missing item
  travelWindow: z.enum(['week', 'month']).optional(),
  sortBy: z.enum(['departure_date', 'created_at', 'full_name', 'progress_percent']).default('departure_date'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
});
