import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ProductType = 'simple' | 'grouped' | 'external' | 'variable';
type ProductDataTab = 'geral' | 'estoque' | 'entrega' | 'relacionados' | 'atributos' | 'avancado';

const tabs: { id: ProductDataTab; label: string }[] = [
  { id: 'geral', label: 'Geral' },
  { id: 'estoque', label: 'Estoque' },
  { id: 'entrega', label: 'Entrega' },
  { id: 'relacionados', label: 'Produtos relacionados' },
  { id: 'atributos', label: 'Atributos' },
  { id: 'avancado', label: 'Avançado' },
];

export default function ProductDataPanel() {
  const [productType, setProductType] = useState<ProductType>('simple');
  const [activeTab, setActiveTab] = useState<ProductDataTab>('geral');
  const [isVirtual, setIsVirtual] = useState(false);
  const [isDownloadable, setIsDownloadable] = useState(false);

  return (
    <div className="rounded-md border border-input bg-card">
      <div className="border-b border-border px-4 py-3 space-y-3">
        <Label className="text-sm font-semibold">Dados do produto</Label>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_auto] gap-3 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="product-type">Tipo de produto</Label>
            <select
              id="product-type"
              value={productType}
              onChange={(event) => setProductType(event.target.value as ProductType)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="simple">Produto simples</option>
              <option value="grouped">Grupo de produto</option>
              <option value="external">Produto externo/afiliado</option>
              <option value="variable">Produto variável</option>
            </select>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={isVirtual}
              onChange={(event) => setIsVirtual(event.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Virtual
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={isDownloadable}
              onChange={(event) => setIsDownloadable(event.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Baixável
          </label>
        </div>
      </div>

      <div className="border-b border-border px-3 pt-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={cn('h-8 text-xs', activeTab === tab.id && 'bg-muted text-foreground')}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {activeTab === 'geral' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="regular_price">Preço (R$)</Label>
              <Input id="regular_price" placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale_price">Preço promocional (R$)</Label>
              <Input id="sale_price" placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale_from">De</Label>
              <Input id="sale_from" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale_to">Até</Label>
              <Input id="sale_to" type="date" />
            </div>
          </div>
        )}

        {activeTab === 'estoque' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="stock_qty">Quantidade</Label>
              <Input id="stock_qty" type="number" min={0} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock_status">Status do estoque</Label>
              <select
                id="stock_status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue="instock"
              >
                <option value="instock">Em estoque</option>
                <option value="outofstock">Fora de estoque</option>
                <option value="onbackorder">Sob encomenda</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'entrega' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="peso">Peso (g)</Label>
              <Input id="peso" type="number" min={0} placeholder="0" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="comprimento">Comprimento</Label>
                <Input id="comprimento" placeholder="cm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="largura">Largura</Label>
                <Input id="largura" placeholder="cm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="altura">Altura</Label>
                <Input id="altura" placeholder="cm" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'relacionados' && (
          <div className="space-y-2">
            <Label htmlFor="upsell">Upsells</Label>
            <Input id="upsell" placeholder="Pesquisar produtos para sugerir" />
            <Label htmlFor="crosssell">Venda cruzada</Label>
            <Input id="crosssell" placeholder="Pesquisar produtos para carrinho" />
          </div>
        )}

        {activeTab === 'atributos' && (
          <div className="space-y-2">
            <Label htmlFor="attribute_name">Nome do atributo</Label>
            <Input id="attribute_name" placeholder="Ex: Material" />
            <Label htmlFor="attribute_values">Valores</Label>
            <Input id="attribute_values" placeholder="Ex: Algodão | Poliéster" />
          </div>
        )}

        {activeTab === 'avancado' && (
          <div className="space-y-2">
            <Label htmlFor="purchase_note">Observação de compra</Label>
            <Input id="purchase_note" placeholder="Mensagem pós-compra" />
            <Label htmlFor="menu_order">Ordem do menu</Label>
            <Input id="menu_order" type="number" min={0} defaultValue={0} />
          </div>
        )}
      </div>
    </div>
  );
}