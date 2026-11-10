import { z } from 'zod';

export const goalChoices = [
  { value: 'lose', title: 'Gå ner i vikt', detail: 'Hitta en balanserad mängd som passar dig.' },
  { value: 'maintain', title: 'Hålla min vikt', detail: 'Skapa en jämn och hållbar måltidsrytm.' },
  { value: 'gain', title: 'Gå upp i vikt', detail: 'Ge kroppen mer mat och regelbundna måltider.' },
] as const;
export const profileSchema = z.object({
  display_name: z.string().trim().min(1, 'Skriv ditt namn.').max(80),
  goal: z.enum(['lose', 'maintain', 'gain']),
  diet: z.enum(['mixed', 'vegetarian', 'vegan', 'pescatarian']),
  allergies: z.string().trim().max(500),
  activity: z.enum(['low', 'moderate', 'high']),
  wake_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  sleep_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});
export type ProfileAnswers = z.infer<typeof profileSchema>;
export const initialAnswers: ProfileAnswers = { display_name: '', goal: 'maintain', diet: 'mixed', allergies: '', activity: 'moderate', wake_time: '07:00', sleep_time: '22:00' };
export const emailSchema = z.string().trim().email('Skriv en giltig e-postadress.').max(255);
export const passwordSchema = z.string().min(8, 'Lösenordet behöver minst 8 tecken.').max(128);