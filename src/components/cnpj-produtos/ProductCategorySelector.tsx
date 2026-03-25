import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProductCategorySelectorProps {
  value?: string;
  options?: string[];
  onChange: (category: string) => void;
}

const normalizeOptionLabels = (options: string[]) =>
  Array.from(new Set(options.map((item) => item.trim()).filter(Boolean)));

const ProductCategorySelector: React.FC<ProductCategorySelectorProps> = ({ value = '', options = [], onChange }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const normalizedOptions = useMemo(() => normalizeOptionLabels(options), [options]);
  const allOptions = useMemo(() => normalizeOptionLabels([...normalizedOptions, ...customCategories]), [normalizedOptions, customCategories]);

  useEffect(() => {
    const currentValue = value.trim();
    if (!currentValue) {
      setSelectedCategory('');
      return;
    }

    const matched = allOptions.find((item) => item.toLowerCase() === currentValue.toLowerCase());
    if (matched) {
      setSelectedCategory(matched);
      return;
    }

    setCustomCategories((prev) => normalizeOptionLabels([...prev, currentValue]));
    setSelectedCategory(currentValue);
  }, [allOptions, value]);

  const toggleCategory = (category: string) => {
    const next = selectedCategory.toLowerCase() === category.toLowerCase() ? '' : category;
    setSelectedCategory(next);
    onChange(next);
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;

    setCustomCategories((prev) => normalizeOptionLabels([...prev, name]));
    setSelectedCategory(name);
    onChange(name);
    setNewCategoryName('');
  };

  return (
    <div className="space-y-3 [&_label]:text-[13px] sm:[&_label]:text-sm [&_input]:text-sm [&_button]:text-sm">
      <div className="max-h-72 overflow-y-auto rounded-md border border-border p-3">
        {allOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma categoria disponível no banco ainda.</p>
        ) : (
          <ul className="space-y-1">
            {allOptions.map((category) => (
              <li key={category}>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-input"
                    checked={selectedCategory.toLowerCase() === category.toLowerCase()}
                    onChange={() => toggleCategory(category)}
                  />
                  <span>{category}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2 border-t border-border pt-2">
        <Label htmlFor="newproduct_cat" className="text-xs text-muted-foreground">
          Adicionar nova categoria
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="newproduct_cat"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Novo nome da categoria"
          />
          <Button type="button" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCategorySelector;