import React, { useEffect, useMemo, useState } from 'react';

interface ProductCategorySelectorProps {
  value?: string;
  options?: string[];
  onChange: (category: string) => void;
}

const normalizeOptionLabels = (options: string[]) =>
  Array.from(new Set(options.map((item) => item.trim()).filter(Boolean)));

const ProductCategorySelector: React.FC<ProductCategorySelectorProps> = ({ value = '', options = [], onChange }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const normalizedOptions = useMemo(() => normalizeOptionLabels(options), [options]);

  useEffect(() => {
    const currentValue = value.trim();
    if (!currentValue) {
      setSelectedCategory('');
      return;
    }

    const matched = normalizedOptions.find((item) => item.toLowerCase() === currentValue.toLowerCase());
    setSelectedCategory(matched || '');
  }, [normalizedOptions, value]);

  const toggleCategory = (category: string) => {
    const next = selectedCategory.toLowerCase() === category.toLowerCase() ? '' : category;
    setSelectedCategory(next);
    onChange(next);
  };

  if (normalizedOptions.length === 0) return null;

  return (
    <div className="space-y-3 [&_label]:text-[13px] sm:[&_label]:text-sm [&_input]:text-sm [&_button]:text-sm">
      <div className="max-h-72 overflow-y-auto rounded-md border border-border p-3">
        <ul className="space-y-1">
          {normalizedOptions.map((category) => (
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
      </div>
    </div>
  );
};

export default ProductCategorySelector;