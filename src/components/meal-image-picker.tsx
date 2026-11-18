import { useState } from 'react';
import { Check, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mealImages } from '@/lib/meal-images';

export function MealImagePicker({ value, onChange, disabled }: { value: string | null; onChange: (key: string | null) => void; disabled: boolean }) {
  const [category, setCategory] = useState<'food' | 'drink'>(value?.startsWith('drink-') ? 'drink' : 'food');
  return <section aria-labelledby="meal-image-label">
    <h3 id="meal-image-label" className="font-display text-lg">Bild till måltiden</h3>
    <div role="group" aria-label="Bildkategori" className="mt-3 flex flex-wrap gap-2">
      <Button type="button" size="sm" variant={category === 'food' ? 'selected' : 'outline'} aria-pressed={category === 'food'} onClick={() => setCategory('food')}>Mat</Button>
      <Button type="button" size="sm" variant={category === 'drink' ? 'selected' : 'outline'} aria-pressed={category === 'drink'} onClick={() => setCategory('drink')}>Dryck</Button>
      <Button type="button" size="sm" variant={value === null ? 'selected' : 'ghost'} aria-pressed={value === null} disabled={disabled} onClick={() => onChange(null)}><Utensils className="size-4" />Ingen egen bild</Button>
    </div>
    <div role="group" aria-label="Välj bild" className="mt-3 grid max-h-40 grid-cols-[repeat(auto-fill,3rem)] gap-1 overflow-y-auto p-1">
      {mealImages.filter(image => image.category === category).map(image => <Button key={image.key} type="button" variant="outline" disabled={disabled} aria-label={`Välj bild: ${image.label}`} title={image.label} aria-pressed={value === image.key} onClick={() => onChange(image.key)} className={`relative aspect-square h-auto min-w-0 p-0.5 ${value === image.key ? 'border-2 border-primary bg-primary/25 ring-1 ring-primary hover:bg-primary/35' : 'bg-card'}`}>
        <img src={image.src} alt="" width={48} height={48} loading="lazy" className="aspect-square w-full rounded-sm object-contain" />
        {value === image.key && <span className="absolute right-0 top-0 rounded-full bg-primary p-0.5 text-primary-foreground"><Check className="size-3" /></span>}
      </Button>)}
    </div>
  </section>;
}