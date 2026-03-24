import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const CnpjProdutos = () => {
  const [productType, setProductType] = useState<'simple' | 'grouped' | 'external' | 'variable'>('simple');
  const [isVirtual, setIsVirtual] = useState(false);
  const [isDownloadable, setIsDownloadable] = useState(false);
  const [manageStock, setManageStock] = useState(false);
  const [showSaleSchedule, setShowSaleSchedule] = useState(false);

  const showShippingTab = !isVirtual && productType !== 'grouped' && productType !== 'external';
  const showVariationsTab = productType === 'variable';

  return (
    <div className="px-2 sm:px-4 py-4 sm:py-6">
      <div id="woocommerce-product-data" className="rounded-md border border-input bg-card text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-input px-4 py-3">
          <h2 className="flex flex-wrap items-center gap-3 text-base font-semibold">
            Dados do produto
            <span className="flex flex-wrap items-center gap-3 text-sm font-normal text-muted-foreground">
              —
              <Label htmlFor="product-type" className="sr-only">Tipo de produto</Label>
              <select
                id="product-type"
                name="product-type"
                value={productType}
                onChange={(e) => setProductType(e.target.value as 'simple' | 'grouped' | 'external' | 'variable')}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <optgroup label="Tipo de produto">
                  <option value="simple">Produto simples</option>
                  <option value="grouped">Grupo de produto</option>
                  <option value="external">Produto externo/afiliado</option>
                  <option value="variable">Produto variável</option>
                </optgroup>
              </select>

              <Label htmlFor="_virtual" className="flex items-center gap-2 text-sm font-normal">
                <Checkbox id="_virtual" checked={isVirtual} onCheckedChange={(value) => setIsVirtual(Boolean(value))} />
                Virtual
              </Label>

              <Label htmlFor="_downloadable" className="flex items-center gap-2 text-sm font-normal">
                <Checkbox id="_downloadable" checked={isDownloadable} onCheckedChange={(value) => setIsDownloadable(Boolean(value))} />
                Baixável
              </Label>
            </span>
          </h2>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" aria-label="Mover para cima">↑</Button>
            <Button type="button" variant="outline" size="icon" aria-label="Mover para baixo">↓</Button>
            <Button type="button" variant="outline" size="icon" aria-label="Alternar painel">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-4 h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="inventory">Estoque</TabsTrigger>
              {showShippingTab && <TabsTrigger value="shipping">Entrega</TabsTrigger>}
              <TabsTrigger value="linked">Produtos relacionados</TabsTrigger>
              <TabsTrigger value="attributes">Atributos</TabsTrigger>
              {showVariationsTab && <TabsTrigger value="variations">Variações</TabsTrigger>}
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              {productType === 'external' && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="_product_url">URL do produto</Label>
                    <Input id="_product_url" type="url" placeholder="https://" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="_button_text">Texto do botão</Label>
                    <Input id="_button_text" placeholder="Comprar produto" />
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="_regular_price">Preço (R$)</Label>
                  <Input id="_regular_price" type="number" step="0.01" min={0} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="_sale_price">Preço promocional (R$)</Label>
                  <Input id="_sale_price" type="number" step="0.01" min={0} />
                  <button type="button" onClick={() => setShowSaleSchedule((prev) => !prev)} className="text-sm underline-offset-4 hover:underline">
                    {showSaleSchedule ? 'Cancelar programação' : 'Programar'}
                  </button>
                </div>
              </div>

              {showSaleSchedule && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="_sale_price_dates_from">De… YYYY-MM-DD</Label>
                    <Input id="_sale_price_dates_from" type="date" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="_sale_price_dates_to">Para… YYYY-MM-DD</Label>
                    <Input id="_sale_price_dates_to" type="date" />
                  </div>
                </div>
              )}

              {isDownloadable && (
                <div className="space-y-3 rounded-md border border-input p-3">
                  <p className="text-sm font-medium">Arquivos baixáveis</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input placeholder="Nome do arquivo" />
                    <Input placeholder="https://" />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="_download_limit">Limite de downloads</Label>
                      <Input id="_download_limit" type="number" min={0} placeholder="Ilimitado" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="_download_expiry">Validade do download</Label>
                      <Input id="_download_expiry" type="number" min={0} placeholder="Nunca" />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="_sku">SKU</Label>
                  <Input id="_sku" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="_global_unique_id">GTIN, UPC, EAN ou ISBN</Label>
                  <Input id="_global_unique_id" />
                </div>
              </div>

              <Label htmlFor="_manage_stock" className="flex items-center gap-2 text-sm font-normal">
                <Checkbox id="_manage_stock" checked={manageStock} onCheckedChange={(value) => setManageStock(Boolean(value))} />
                Acompanhe a quantidade de estoque para este produto
              </Label>

              {manageStock && (
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="_stock">Quantidade</Label>
                    <Input id="_stock" type="number" min={0} defaultValue={1} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="_backorders">Permitir encomendas?</Label>
                    <select id="_backorders" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="no">Não permitir</option>
                      <option value="notify">Permitir, mas informar o cliente</option>
                      <option value="yes">Permitir</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="_low_stock_amount">Limiar de estoque baixo</Label>
                    <Input id="_low_stock_amount" type="number" min={0} />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="_stock_status">Status do estoque</Label>
                <select id="_stock_status" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm md:w-[280px]">
                  <option value="instock">Em estoque</option>
                  <option value="outofstock">Fora de estoque</option>
                  <option value="onbackorder">Sob encomenda</option>
                </select>
              </div>

              <Label htmlFor="_sold_individually" className="flex items-center gap-2 text-sm font-normal">
                <Checkbox id="_sold_individually" />
                Limitar compras para 1 item por pedido
              </Label>
            </TabsContent>

            {showShippingTab && (
              <TabsContent value="shipping" className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="_weight">Peso (g)</Label>
                    <Input id="_weight" type="number" min={0} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dimensões (cm)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="Comprimento" />
                      <Input placeholder="Largura" />
                      <Input placeholder="Altura" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="product_shipping_class">Classe de entrega</Label>
                  <select id="product_shipping_class" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm md:w-[320px]">
                    <option value="-1">Nenhuma classe de entrega</option>
                  </select>
                </div>
              </TabsContent>
            )}

            <TabsContent value="linked" className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="upsell_ids">Upsells</Label>
                <Input id="upsell_ids" placeholder="Pesquisar um produto…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="crosssell_ids">Venda cruzada</Label>
                <Input id="crosssell_ids" placeholder="Pesquisar um produto…" />
              </div>
            </TabsContent>

            <TabsContent value="attributes" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Adicione informações descritivas que os clientes podem usar para pesquisar este produto em sua loja, como “Material” ou “Tamanho”.
              </p>

              <div className="rounded-md border border-input p-3 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="attribute_name">Nome</Label>
                    <Input id="attribute_name" placeholder="por exemplo comprimento ou peso" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="attribute_values">Valor(es)</Label>
                    <Textarea id="attribute_values" placeholder="Use “|” para separar valores diferentes." />
                  </div>
                </div>
                <div className="flex flex-wrap gap-5">
                  <Label htmlFor="attribute_visibility" className="flex items-center gap-2 text-sm font-normal">
                    <Checkbox id="attribute_visibility" defaultChecked />
                    Visível na página de produto
                  </Label>
                  {showVariationsTab && (
                    <Label htmlFor="attribute_variation" className="flex items-center gap-2 text-sm font-normal">
                      <Checkbox id="attribute_variation" />
                      Usado para variações
                    </Label>
                  )}
                </div>
                <Button type="button" variant="outline">Salvar atributos</Button>
              </div>
            </TabsContent>

            {showVariationsTab && (
              <TabsContent value="variations" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Adicione alguns atributos na aba Atributos para gerar variações e marque “Usado para variações”.
                </p>
              </TabsContent>
            )}

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="_purchase_note">Observação de compra</Label>
                <Textarea id="_purchase_note" rows={2} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="menu_order">Ordem do menu</Label>
                  <Input id="menu_order" type="number" defaultValue={0} />
                </div>
                <div className="flex items-end">
                  <Label htmlFor="comment_status" className="flex items-center gap-2 text-sm font-normal">
                    <Checkbox id="comment_status" defaultChecked />
                    Ativar avaliações
                  </Label>
                </div>
              </div>

              <Label htmlFor="_visible_in_pos" className="flex items-center gap-2 text-sm font-normal">
                <Checkbox id="_visible_in_pos" defaultChecked />
                Available for POS
              </Label>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CnpjProdutos;
