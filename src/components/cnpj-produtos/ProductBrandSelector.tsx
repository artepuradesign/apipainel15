import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProductBrandSelectorProps {
  value?: string;
  options?: string[];
  onChange: (value: string) => void;
}

const normalizeBrandOptions = (options: string[]) =>
  Array.from(new Set(options.map((item) => item.trim()).filter(Boolean)));

const ProductBrandSelector: React.FC<ProductBrandSelectorProps> = ({ value = '', options = [], onChange }) => {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [customBrands, setCustomBrands] = useState<string[]>([]);
  const [newBrandName, setNewBrandName] = useState('');
  const normalizedOptions = useMemo(() => normalizeBrandOptions(options), [options]);
  const allOptions = useMemo(() => normalizeBrandOptions([...normalizedOptions, ...customBrands]), [normalizedOptions, customBrands]);

  useEffect(() => {
    const parsed = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!parsed.length) {
      setSelectedBrands([]);
      return;
    }

    const missingFromOptions = parsed.filter((item) => !allOptions.some((option) => option.toLowerCase() === item.toLowerCase()));
    if (missingFromOptions.length > 0) {
      setCustomBrands((prev) => normalizeBrandOptions([...prev, ...missingFromOptions]));
    }

    const nextSelected = [...new Set(parsed)];
    setSelectedBrands(nextSelected);
  }, [allOptions, value]);

  const syncSelected = (next: string[]) => {
    setSelectedBrands(next);
    onChange(next.join(', '));
  };

  const toggleBrand = (label: string) => {
    const alreadySelected = selectedBrands.some((item) => item.toLowerCase() === label.toLowerCase());
    if (alreadySelected) {
      syncSelected(selectedBrands.filter((item) => item.toLowerCase() !== label.toLowerCase()));
      return;
    }

    syncSelected([...selectedBrands, label]);
  };

  const handleAddBrand = () => {
    const name = newBrandName.trim();
    if (!name) return;

    const nextCustom = normalizeBrandOptions([...customBrands, name]);
    setCustomBrands(nextCustom);

    const alreadySelected = selectedBrands.some((item) => item.toLowerCase() === name.toLowerCase());
    const nextSelected = alreadySelected ? selectedBrands : [...selectedBrands, name];
    syncSelected(nextSelected);
    setNewBrandName('');
  };

  return (
    <div className="space-y-3 [&_label]:text-[13px] sm:[&_label]:text-sm [&_input]:text-sm [&_button]:text-sm">
      <div className="max-h-60 overflow-y-auto rounded-md border border-border p-3">
        {allOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma marca disponível no banco ainda.</p>
        ) : (
          <ul className="space-y-1">
            {allOptions.map((brand) => (
              <li key={brand}>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-input"
                    checked={selectedBrands.some((item) => item.toLowerCase() === brand.toLowerCase())}
                    onChange={() => toggleBrand(brand)}
                  />
                  <span>{brand}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2 border-t border-border pt-2">
        <Label htmlFor="newproduct_brand" className="text-xs text-muted-foreground">
          Adicionar nova marca
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="newproduct_brand"
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            placeholder="Nova marca"
          />
          <Button type="button" onClick={handleAddBrand} disabled={!newBrandName.trim()}>
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductBrandSelector;