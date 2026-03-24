import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type BrandNode = {
  id: number;
  label: string;
  children?: BrandNode[];
  popular?: boolean;
};

const DEFAULT_BRANDS: BrandNode[] = [
  { id: 1, label: 'Sem marca', popular: true },
  { id: 2, label: 'Premium Foods', popular: true },
  { id: 3, label: 'Ouro do Sertão', popular: true },
  { id: 4, label: 'Natural Boost', popular: false },
];

const flattenBrands = (nodes: BrandNode[], depth = 0): Array<{ id: number; label: string; depth: number; popular?: boolean }> =>
  nodes.flatMap((node) => [
    { id: node.id, label: node.label, depth, popular: node.popular },
    ...(node.children ? flattenBrands(node.children, depth + 1) : []),
  ]);

const addBrandToTree = (nodes: BrandNode[], parentId: number, newNode: BrandNode): BrandNode[] => {
  if (parentId === -1) return [...nodes, newNode];

  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children || []), newNode] };
    }

    if (!node.children) return node;
    return { ...node, children: addBrandToTree(node.children, parentId, newNode) };
  });
};

interface ProductBrandSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

const ProductBrandSelector: React.FC<ProductBrandSelectorProps> = ({ value = '', onChange }) => {
  const [tab, setTab] = useState<'all' | 'popular'>('all');
  const [showAdder, setShowAdder] = useState(false);
  const [brandTree, setBrandTree] = useState<BrandNode[]>(DEFAULT_BRANDS);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandParentId, setNewBrandParentId] = useState('-1');
  const [selectedBrandIds, setSelectedBrandIds] = useState<Set<number>>(new Set());

  const flattened = useMemo(() => flattenBrands(brandTree), [brandTree]);
  const idToLabel = useMemo(() => new Map(flattened.map((item) => [item.id, item.label])), [flattened]);

  useEffect(() => {
    if (!value?.trim()) return;
    const parsed = value.split(',').map((item) => item.trim()).filter(Boolean);
    const selected = flattened.filter((item) => parsed.some((tag) => tag.toLowerCase() === item.label.toLowerCase()));
    if (selected.length) setSelectedBrandIds(new Set(selected.map((item) => item.id)));
  }, [flattened, value]);

  const syncSelected = (nextSet: Set<number>) => {
    setSelectedBrandIds(nextSet);
    const labels = Array.from(nextSet).map((id) => idToLabel.get(id)).filter(Boolean) as string[];
    onChange(labels.join(', '));
  };

  const toggleBrand = (id: number) => {
    const next = new Set(selectedBrandIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    syncSelected(next);
  };

  const handleAddBrand = () => {
    const name = newBrandName.trim();
    if (!name) return;

    const newId = Date.now();
    const parentId = Number(newBrandParentId);
    const newNode: BrandNode = { id: newId, label: name };

    setBrandTree((prev) => addBrandToTree(prev, parentId, newNode));
    const next = new Set(selectedBrandIds);
    next.add(newId);
    syncSelected(next);
    setNewBrandName('');
    setNewBrandParentId('-1');
    setShowAdder(false);
    setTab('all');
  };

  const renderList = (nodes: BrandNode[], depth = 0) =>
    nodes.map((node) => {
      const shouldRender = tab === 'all' || !!node.popular;

      return (
        <li key={node.id} className="space-y-1">
          {shouldRender && (
            <label className="flex items-start gap-2 text-sm" style={{ paddingLeft: `${depth * 14}px` }}>
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-input"
                checked={selectedBrandIds.has(node.id)}
                onChange={() => toggleBrand(node.id)}
              />
              <span>{node.label}</span>
            </label>
          )}

          {node.children?.length ? <ul className="space-y-1">{renderList(node.children, depth + 1)}</ul> : null}
        </li>
      );
    });

  return (
    <div className="space-y-3 [&_label]:text-[13px] sm:[&_label]:text-sm [&_input]:text-sm [&_button]:text-sm">
      <div className="flex items-center gap-4 border-b border-border pb-2">
        <button type="button" onClick={() => setTab('all')} className={`text-sm ${tab === 'all' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
          Todas as marcas
        </button>
        <button type="button" onClick={() => setTab('popular')} className={`text-sm ${tab === 'popular' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
          Mais usadas
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto rounded-md border border-border p-3">
        <ul className="space-y-1">{renderList(brandTree)}</ul>
      </div>

      <div className="space-y-2 border-t border-border pt-2">
        <button type="button" className="text-sm text-primary hover:underline" onClick={() => setShowAdder((prev) => !prev)}>
          + Adicionar nova marca
        </button>

        {showAdder && (
          <div className="space-y-2 rounded-md border border-border p-3">
            <Label htmlFor="newproduct_brand" className="text-xs text-muted-foreground">
              Adicionar nova marca
            </Label>
            <Input
              id="newproduct_brand"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Nova marca"
            />

            <Label htmlFor="newproduct_brand_parent" className="text-xs text-muted-foreground">
              Marca-mãe
            </Label>
            <Select value={newBrandParentId} onValueChange={setNewBrandParentId}>
              <SelectTrigger id="newproduct_brand_parent">
                <SelectValue placeholder="— Marca-mãe —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">— Marca-mãe —</SelectItem>
                {flattened.map((brand) => (
                  <SelectItem key={brand.id} value={String(brand.id)}>
                    {`${'— '.repeat(brand.depth)}${brand.label}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="button" onClick={handleAddBrand} disabled={!newBrandName.trim()}>
              Adicionar nova marca
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductBrandSelector;