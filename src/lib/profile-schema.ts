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
  height_cm: z.preprocess(v => v === '' || v == null ? null : Number(v), z.number().int('Skriv längden i hela centimeter.').min(100, 'Längden behöver vara mellan 100 och 250 cm.').max(250, 'Längden behöver vara mellan 100 och 250 cm.').nullable()),
  weight_kg: z.preprocess(v => v === '' || v == null ? null : Number(v), z.number().min(30, 'Vikten behöver vara mellan 30 och 300 kg.').max(300, 'Vikten behöver vara mellan 30 och 300 kg.').nullable()),
  target_weight_kg: z.preprocess(v => v === '' || v == null ? null : Number(v), z.number().min(30, 'Målvikten behöver vara mellan 30 och 300 kg.').max(300, 'Målvikten behöver vara mellan 30 och 300 kg.').nullable()),
});
export type ProfileAnswers = z.infer<typeof profileSchema>;
export const initialAnswers: ProfileAnswers = { display_name: '', goal: 'maintain', diet: 'mixed', allergies: '', activity: 'moderate', wake_time: '07:00', sleep_time: '22:00', height_cm: null, weight_kg: null, target_weight_kg: null };
export const workoutSchema = z.object({ kind: z.string().trim().min(1, 'Skriv vad du tränade.').max(80), minutes: z.number().int().min(5, 'Minst 5 minuter.').max(600), intensity: z.enum(['light', 'hard']) });
/** 0 = no training, 1 = light training, 2 = hard or long training (60+ min). */
export function trainingLevel(workouts: { minutes: number; intensity: string }[] = []): 0 | 1 | 2 {
  if (!workouts?.length) return 0;
  const total = workouts.reduce((s, w) => s + w.minutes, 0);
  return workouts.some(w => w.intensity === 'hard') || total >= 60 ? 2 : 1;
}
export const emailSchema = z.string().trim().email('Skriv en giltig e-postadress.').max(255);
export const passwordSchema = z.string().min(8, 'Lösenordet behöver minst 8 tecken.').max(128);