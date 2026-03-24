import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type PopularTag = {
  name: string;
  size: 'sm' | 'md' | 'lg';
};

const POPULAR_TAGS: PopularTag[] = [
  { name: 'bebida energética', size: 'md' },
  { name: 'Brilho Intenso', size: 'lg' },
  { name: 'Cabelos Danificados', size: 'md' },
  { name: 'Cachaça Premium', size: 'md' },
  { name: 'energia natural', size: 'md' },
  { name: 'Hidratação Profunda', size: 'md' },
  { name: 'sem açúcar', size: 'sm' },
  { name: 'sem glúten', size: 'sm' },
  { name: 'suco funcional', size: 'md' },
  { name: 'Tratamento Capilar', size: 'md' },
  { name: 'vitamina C', size: 'sm' },
  { name: 'zero açúcar', size: 'sm' },
];

interface ProductTagSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

const normalizeTags = (raw: string) =>
  raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const uniqueTags = (tags: string[]) => Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));

const ProductTagSelector: React.FC<ProductTagSelectorProps> = ({ value = '', onChange }) => {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagCloud, setShowTagCloud] = useState(false);

  useEffect(() => {
    setTags(uniqueTags(normalizeTags(value)));
  }, [value]);

  const joinedTags = useMemo(() => tags.join(', '), [tags]);

  const syncTags = (next: string[]) => {
    const normalized = uniqueTags(next);
    setTags(normalized);
    onChange(normalized.join(', '));
  };

  const addTag = (tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    syncTags([...tags, clean]);
  };

  const removeTag = (tag: string) => {
    syncTags(tags.filter((item) => item.toLowerCase() !== tag.toLowerCase()));
  };

  const handleAddFromInput = () => {
    if (!tagInput.trim()) return;
    const parsed = normalizeTags(tagInput);
    syncTags([...tags, ...parsed]);
    setTagInput('');
  };

  const cloudTextSize: Record<PopularTag['size'], string> = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-medium',
  };

  return (
    <div className="space-y-3 [&_label]:text-[13px] sm:[&_label]:text-sm [&_input]:text-sm [&_textarea]:text-sm [&_button]:text-sm">
      <div className="space-y-1.5">
        <Label htmlFor="tax-input-product_tag">Adicionar ou remover tags</Label>
        <Textarea
          id="tax-input-product_tag"
          value={joinedTags}
          rows={3}
          onChange={(e) => syncTags(normalizeTags(e.target.value))}
          placeholder="Digite tags separadas por vírgula"
        />
      </div>

      <div className="flex items-center gap-2">
        <Input
          id="new-tag-product_tag"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="Adicionar nova tag"
        />
        <Button type="button" variant="outline" onClick={handleAddFromInput} disabled={!tagInput.trim()}>
          Adicionar
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">Separar as tags com vírgulas</p>

      <ul className="flex flex-wrap gap-2" role="list" aria-label="Tags selecionadas">
        {tags.map((tag) => (
          <li key={tag}>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-input bg-muted px-2 py-1 text-xs"
              onClick={() => removeTag(tag)}
              title="Remover tag"
            >
              {tag}
              <span aria-hidden="true">×</span>
            </button>
          </li>
        ))}
      </ul>

      <div>
        <button type="button" className="text-sm text-primary hover:underline" onClick={() => setShowTagCloud((prev) => !prev)}>
          Escolher das tags mais usadas
        </button>

        {showTagCloud && (
          <ul className="mt-2 flex flex-wrap gap-2 rounded-md border border-border p-3" role="list" aria-label="Nuvem de tags populares">
            {POPULAR_TAGS.map((tag) => (
              <li key={tag.name}>
                <button
                  type="button"
                  className={`text-primary hover:underline ${cloudTextSize[tag.size]}`}
                  onClick={() => addTag(tag.name)}
                >
                  {tag.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProductTagSelector;