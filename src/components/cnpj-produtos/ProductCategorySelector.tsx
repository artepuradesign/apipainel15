import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type CategoryNode = {
  id: number;
  label: string;
  children?: CategoryNode[];
};

const DEFAULT_TREE: CategoryNode[] = [
  { id: 15, label: 'Sem categoria' },
  {
    id: 80,
    label: 'Alimentos',
    children: [
      { id: 83, label: 'Cereais e Farinhas' },
      { id: 81, label: 'Enlatados' },
      { id: 85, label: 'Enlatados e Conservas' },
      { id: 82, label: 'Massas e Grãos' },
      { id: 86, label: 'Molhos e Condimentos' },
      { id: 190, label: 'Recheios e Coberturas' },
      { id: 87, label: 'Secos e Desidratados' },
      { id: 84, label: 'Snacks e Lanches' },
    ],
  },
  {
    id: 89,
    label: 'Bebidas',
    children: [
      { id: 93, label: 'Alcóolicas' },
      { id: 94, label: 'Chás e Cafés' },
      { id: 92, label: 'Energéticos e Isotônicos' },
      { id: 90, label: 'Refrigerantes' },
      { id: 91, label: 'Sucos e Bebidas' },
    ],
  },
  {
    id: 95,
    label: 'Cuidados Pessoais',
    children: [
      { id: 98, label: 'Alisadores e Tratamentos' },
      { id: 97, label: 'Condicionadores' },
      { id: 100, label: 'Cuidados com a Pele' },
      { id: 101, label: 'Produtos para o Cabelo' },
      { id: 99, label: 'Sabonetes e Higiene Corporal' },
      { id: 96, label: 'Shampoos' },
    ],
  },
  {
    id: 102,
    label: 'Produtos de Limpeza',
    children: [
      { id: 103, label: 'Detergentes e Desinfetantes' },
      { id: 105, label: 'Limpeza de Banheiro' },
      { id: 104, label: 'Limpeza de Cozinha' },
      { id: 106, label: 'Multiuso' },
      { id: 107, label: 'Produtos para Roupas' },
      { id: 108, label: 'Utensílios de Limpeza' },
    ],
  },
];

const POPULAR_IDS = new Set([80, 190, 86, 95, 89, 101, 98, 91, 92, 93]);

const flattenCategories = (nodes: CategoryNode[], depth = 0): Array<{ id: number; label: string; depth: number }> =>
  nodes.flatMap((node) => [
    { id: node.id, label: node.label, depth },
    ...(node.children ? flattenCategories(node.children, depth + 1) : []),
  ]);

const addCategoryToTree = (nodes: CategoryNode[], parentId: number, newNode: CategoryNode): CategoryNode[] => {
  if (parentId === -1) return [...nodes, newNode];

  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children || []), newNode] };
    }

    if (!node.children) return node;

    return { ...node, children: addCategoryToTree(node.children, parentId, newNode) };
  });
};

interface ProductCategorySelectorProps {
  value?: string;
  onChange: (category: string) => void;
}

const ProductCategorySelector: React.FC<ProductCategorySelectorProps> = ({ value = '', onChange }) => {
  const [tab, setTab] = useState<'all' | 'popular'>('all');
  const [showAdder, setShowAdder] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParentId, setNewCategoryParentId] = useState('-1');
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>(DEFAULT_TREE);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());

  const flattened = useMemo(() => flattenCategories(categoryTree), [categoryTree]);
  const idToLabel = useMemo(() => new Map(flattened.map((item) => [item.id, item.label])), [flattened]);

  useEffect(() => {
    if (!value?.trim()) return;
    const matched = flattened.find((item) => item.label.toLowerCase() === value.trim().toLowerCase());
    if (matched) setSelectedCategoryIds(new Set([matched.id]));
  }, [flattened, value]);

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);

      const firstSelected = Array.from(next.values())[0];
      onChange(firstSelected ? idToLabel.get(firstSelected) || '' : '');
      return next;
    });
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;

    const newId = Date.now();
    const parentId = Number(newCategoryParentId);
    const newNode: CategoryNode = { id: newId, label: name };

    setCategoryTree((prev) => addCategoryToTree(prev, parentId, newNode));
    setSelectedCategoryIds(new Set([newId]));
    onChange(name);
    setNewCategoryName('');
    setNewCategoryParentId('-1');
    setShowAdder(false);
    setTab('all');
  };

  const renderChecklist = (nodes: CategoryNode[], depth = 0) => {
    return nodes.map((node) => {
      const showInPopular = POPULAR_IDS.has(node.id);

      return (
        <li key={node.id} className="space-y-1">
          {(tab === 'all' || showInPopular) && (
            <label className="flex items-start gap-2 text-sm" style={{ paddingLeft: `${depth * 14}px` }}>
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-input"
                checked={selectedCategoryIds.has(node.id)}
                onChange={() => toggleCategory(node.id)}
              />
              <span>{node.label}</span>
            </label>
          )}

          {node.children?.length ? <ul className="space-y-1">{renderChecklist(node.children, depth + 1)}</ul> : null}
        </li>
      );
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`text-sm ${tab === 'all' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
        >
          Todas as categorias
        </button>
        <button
          type="button"
          onClick={() => setTab('popular')}
          className={`text-sm ${tab === 'popular' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
        >
          Mais usadas
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto rounded-md border border-border p-3">
        <ul className="space-y-1">{renderChecklist(categoryTree)}</ul>
      </div>

      <div className="space-y-2 border-t border-border pt-2">
        <button type="button" className="text-sm text-primary hover:underline" onClick={() => setShowAdder((prev) => !prev)}>
          + Adicionar nova categoria
        </button>

        {showAdder && (
          <div className="space-y-2 rounded-md border border-border p-3">
            <Label htmlFor="newproduct_cat" className="text-xs text-muted-foreground">
              Adicionar nova categoria
            </Label>
            <Input
              id="newproduct_cat"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Novo nome da categoria"
            />

            <Label htmlFor="newproduct_cat_parent" className="text-xs text-muted-foreground">
              Categoria ascendente
            </Label>
            <Select value={newCategoryParentId} onValueChange={setNewCategoryParentId}>
              <SelectTrigger id="newproduct_cat_parent">
                <SelectValue placeholder="— Categoria ascendente —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">— Categoria ascendente —</SelectItem>
                {flattened.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {`${'— '.repeat(item.depth)}${item.label}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="button" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
              Adicionar nova categoria
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCategorySelector;