import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { profileSchema } from './profile-schema';

export const getProfile = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from('profiles').select('*').eq('id', context.userId).single();
    if (error) throw new Error('Dina uppgifter kunde inte hämtas. Försök igen.');
    return data;
  });
export const saveProfile = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from('profiles').upsert({ ...data, id: context.userId, completed: true });
    if (error) throw new Error('Dina svar kunde inte sparas. Försök igen.');
    return { saved: true };
  });