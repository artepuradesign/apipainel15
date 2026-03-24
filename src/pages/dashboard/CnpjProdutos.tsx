import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { Package, Plus, RefreshCw, Pencil, Trash2, Search, ScanLine } from 'lucide-react';
import DashboardTitleCard from '@/components/dashboard/DashboardTitleCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BarcodeScanner from '@/components/cnpj-produtos/BarcodeScanner';
import ProductPhotoUploader from '@/components/cnpj-produtos/ProductPhotoUploader';
import ProductDescriptionEditor from '@/components/cnpj-produtos/ProductDescriptionEditor';
import ProductDataPanel from '@/components/cnpj-produtos/ProductDataPanel';
import ProductCategorySelector from '@/components/cnpj-produtos/ProductCategorySelector';
import ProductTagSelector from '@/components/cnpj-produtos/ProductTagSelector';
import ProductBrandSelector from '@/components/cnpj-produtos/ProductBrandSelector';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cnpjProdutosService, type CnpjProduto, type ProdutoStatus } from '@/services/cnpjProdutosService';

const MODULE_ID = 183;

const PRODUCT_CATEGORIES = [
  'Alimentos e Bebidas',
  'Alimentos Naturais',
  'Artigos para Festas',
  'Artesanato',
  'Automotivo',
  'Bebidas',
  'Beleza e Cosméticos',
  'Brinquedos',
  'Calçados',
  'Casa e Decoração',
  'Celulares e Acessórios',
  'Climatização',
  'Construção',
  'Cozinha e Utilidades',
  'Eletrodomésticos',
  'Eletrônicos',
  'Embalagens',
  'Escritório',
  'Esportes',
  'Ferramentas',
  'Floricultura',
  'Games',
  'Higiene e Limpeza',
  'Informática',
  'Instrumentos Musicais',
  'Joias e Acessórios',
  'Livros e Papelaria',
  'Malas e Mochilas',
  'Materiais Elétricos',
  'Materiais Hidráulicos',
  'Móveis',
  'Moda Feminina',
  'Moda Infantil',
  'Moda Masculina',
  'Ótica',
  'Papelaria',
  'Perfumaria',
  'Pet Shop',
  'Produtos Digitais',
  'Saúde',
  'Saúde e Bem-estar',
  'Segurança',
  'Serviços',
  'Suplementos',
  'Telefonia',
  'Turismo',
  'Vestuário',
] as const;

const produtoSchema = z.object({
  cnpj: z.string().min(14, 'CNPJ deve conter 14 dígitos').max(18, 'CNPJ inválido'),
  nome_empresa: z.string().trim().min(2, 'Informe a empresa').max(255, 'Máximo de 255 caracteres'),
  nome_produto: z.string().trim().min(2, 'Informe o produto').max(255, 'Máximo de 255 caracteres'),
  sku: z.string().trim().max(120, 'Máximo de 120 caracteres').optional().or(z.literal('')),
  categoria: z.string().trim().max(120, 'Máximo de 120 caracteres').optional().or(z.literal('')),
  codigo_barras: z.string().trim().max(64, 'Máximo de 64 caracteres').optional().or(z.literal('')),
  controlar_estoque: z.boolean(),
  fotos: z.array(z.string().trim().min(1, 'Foto inválida')).max(5, 'Máximo de 5 fotos'),
  preco: z.number().min(0, 'Preço não pode ser negativo'),
  estoque: z.number().int().min(0, 'Estoque não pode ser negativo'),
  status: z.enum(['ativo', 'inativo', 'rascunho']),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

const emptyForm: ProdutoFormData = {
  cnpj: '',
  nome_empresa: '',
  nome_produto: '',
  sku: '',
  categoria: '',
  codigo_barras: '',
  controlar_estoque: false,
  fotos: [],
  preco: 0,
  estoque: 0,
  status: 'ativo',
};

const statusLabel: Record<ProdutoStatus, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  rascunho: 'Rascunho',
};

const PHOTO_SLOTS_TOTAL = 5;

const API_FILES_BASE_URL = 'https://api.apipainel.com.br';

const extractFilenameFromPhotoValue = (value: string) => {
  const trimmed = decodeURIComponent(value.trim().replace(/^"|"$/g, ''));
  if (!trimmed) return '';

  const noLeadingSlash = trimmed.replace(/^\/+/, '');

  if (/^api\/upload\/serve\?/i.test(noLeadingSlash)) {
    const query = noLeadingSlash.split('?')[1] || '';
    const params = new URLSearchParams(query);
    const fileParam = params.get('file')?.trim();
    if (fileParam) {
      const decodedParam = decodeURIComponent(fileParam).trim();
      if (/^https?:\/\//i.test(decodedParam) || /^api\/upload\/serve\?/i.test(decodedParam)) {
        return extractFilenameFromPhotoValue(decodedParam);
      }

      return decodedParam.split('/').pop()?.trim() || '';
    }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const fileParam = parsed.searchParams.get('file')?.trim();
      if (fileParam) {
        const decodedParam = decodeURIComponent(fileParam).trim();
        if (/^https?:\/\//i.test(decodedParam) || /^api\/upload\/serve\?/i.test(decodedParam)) {
          return extractFilenameFromPhotoValue(decodedParam);
        }

        return decodedParam.split('/').pop()?.trim() || '';
      }

      const lastPathChunk = parsed.pathname.split('/').pop()?.trim();
      if (lastPathChunk) return lastPathChunk;
    } catch {
      return '';
    }
  }

  if (/^(fotos|uploads|base-foto|produtos)\//i.test(noLeadingSlash)) {
    return noLeadingSlash.split('/').pop()?.trim() || '';
  }

  const extMatch = noLeadingSlash.match(/([A-Za-z0-9._-]+\.(?:png|jpe?g|webp|gif|bmp|svg|avif))/i);
  if (extMatch?.[1]) return extMatch[1].trim();

  return noLeadingSlash.split('?')[0].trim();
};

const normalizeSingleProductPhotoUrl = (value: unknown) => {
  if (typeof value !== 'string') return '';

  const raw = value.trim().replace(/^"|"$/g, '');
  if (!raw) return '';

  const filename = extractFilenameFromPhotoValue(raw);
  if (!filename) return '';

  return `${API_FILES_BASE_URL}/produtos/${encodeURIComponent(filename)}`;
};

const parsePhotosInput = (input?: unknown) => {
  if (Array.isArray(input)) return input;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return [parsed];
    } catch {
      // fallback para string simples ou lista separada por vírgula
    }

    if (trimmed.includes(',')) {
      return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
    }

    return [trimmed];
  }

  return [];
};

const normalizeProductPhotos = (fotos?: unknown, fotosJson?: unknown) => {
  const merged = [...parsePhotosInput(fotos), ...parsePhotosInput(fotosJson)]
    .map(normalizeSingleProductPhotoUrl)
    .filter((url): url is string => url.length > 0);

  return Array.from(new Set(merged)).slice(0, PHOTO_SLOTS_TOTAL);
};

const toPhotoSlots = (fotos: string[] = []) => {
  const slots = Array.from({ length: PHOTO_SLOTS_TOTAL }, () => '');
  fotos.slice(0, PHOTO_SLOTS_TOTAL).forEach((url, index) => {
    slots[index] = url;
  });
  return slots;
};

const createEmptyFileSlots = () => Array.from({ length: PHOTO_SLOTS_TOTAL }, () => null as File | null);

const sanitizePhotoUrls = (fotos: string[]) =>
  fotos
    .map((url) => url.trim())
    .filter((url) => url.length > 0)
    .slice(0, PHOTO_SLOTS_TOTAL);

const toPhotoStorageValue = (value: string) => {
  const extracted = extractFilenameFromPhotoValue(value);
  return extracted.replace(/^\/+/, '').trim();
};

const CnpjProdutos = () => {
  const { profile, user } = useAuth();
  const isAdmin = profile?.user_role === 'admin' || profile?.user_role === 'suporte';

  const [produtos, setProdutos] = useState<CnpjProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | ProdutoStatus>('todos');

  const [formData, setFormData] = useState<ProdutoFormData>(emptyForm);
  const [descricaoProdutoHtml, setDescricaoProdutoHtml] = useState('');
  const [productPhotos, setProductPhotos] = useState<string[]>(toPhotoSlots());
  const [pendingPhotoFiles, setPendingPhotoFiles] = useState<(File | null)[]>(createEmptyFileSlots());
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'form' | 'search'>('form');
  const [editing, setEditing] = useState<CnpjProduto | null>(null);
  const [saving, setSaving] = useState(false);
  const [catalogVisibility, setCatalogVisibility] = useState<'loja_busca' | 'somente_loja' | 'somente_busca' | 'oculto'>('loja_busca');
  const [tagsProduto, setTagsProduto] = useState('');
  const [marcaProduto, setMarcaProduto] = useState('');
  const [externalFeaturedImageUrl, setExternalFeaturedImageUrl] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<CnpjProduto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const userCnpj = formatCnpj(user?.cnpj || '');
  const userEmpresa = (user?.full_name || '').trim();

  const canUseUserCompanyData = userCnpj.replace(/\D/g, '').length === 14 && userEmpresa.length > 1;

  const loadProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const result = await cnpjProdutosService.list({
        limit: 200,
        offset: 0,
        search: search.trim() || undefined,
        status: statusFilter,
      });

      if (result.success && result.data) {
        const normalizedProducts = (result.data.data || []).map((produto) => ({
          ...produto,
          fotos: normalizeProductPhotos(produto.fotos, produto.fotos_json),
        }));
        setProdutos(normalizedProducts);
      } else {
        setProdutos([]);
        if (result.error) toast.error(result.error);
      }
    } catch {
      setProdutos([]);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadProdutos();
  }, [loadProdutos]);

  const resumo = useMemo(() => {
    const total = produtos.length;
    const ativos = produtos.filter((p) => p.status === 'ativo').length;
    const rascunho = produtos.filter((p) => p.status === 'rascunho').length;
    const baixoEstoque = produtos.filter((p) => (p.controlar_estoque === true || p.controlar_estoque === 1) && p.estoque <= 5).length;

    return { total, ativos, rascunho, baixoEstoque };
  }, [produtos]);

  const resetForm = () => {
    setFormData({
      ...emptyForm,
      cnpj: userCnpj,
      nome_empresa: userEmpresa,
      fotos: [],
    });
    setDescricaoProdutoHtml('');
    setProductPhotos(toPhotoSlots());
    setPendingPhotoFiles(createEmptyFileSlots());
    setEditing(null);
  };

  useEffect(() => {
    if (editing) return;
    setFormData((prev) => ({
      ...prev,
      cnpj: userCnpj,
      nome_empresa: userEmpresa,
    }));
  }, [editing, userCnpj, userEmpresa]);

  const handleUploadPhotoSlot = async (slotIndex: number, file: File | null) => {
    if (!file) return;

    setPendingPhotoFiles((prev) => {
      const next = [...prev];
      next[slotIndex] = file;
      return next;
    });

    toast.success(`Foto ${slotIndex + 1} pronta para salvar`);
  };

  const handleSave = async () => {
    if (uploadingPhotos) {
      toast.error('Aguarde o envio das fotos terminar antes de salvar o produto');
      return;
    }

    if (!canUseUserCompanyData) {
      toast.error('Complete CNPJ e nome no menu Dados Pessoais antes de cadastrar produtos');
      return;
    }

    let finalPhotos = toPhotoSlots(productPhotos);
    const pendingEntries = pendingPhotoFiles
      .map((file, index) => ({ file, index }))
      .filter((entry): entry is { file: File; index: number } => entry.file instanceof File);

    if (pendingEntries.length > 0) {
      setUploadingPhotos(true);
      try {
        const uploaded = await Promise.all(
          pendingEntries.map(async ({ file, index }) => {
            const result = await cnpjProdutosService.uploadFoto(file);
            const persistedPhotoValue = (result.data?.filename || result.data?.url || '').trim();

            if (!result.success || !persistedPhotoValue) {
              throw new Error(result.error || `Falha ao enviar foto ${index + 1}`);
            }

            return { index, value: persistedPhotoValue };
          })
        );

        const merged = toPhotoSlots(productPhotos);
        uploaded.forEach(({ index, value }) => {
          merged[index] = value;
        });

        finalPhotos = merged;
        setProductPhotos(merged);
        setPendingPhotoFiles(createEmptyFileSlots());
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao enviar fotos antes de salvar');
        return;
      } finally {
        setUploadingPhotos(false);
      }
    }

    const payload = {
      ...formData,
      cnpj: userCnpj,
      nome_empresa: userEmpresa,
      estoque: formData.controlar_estoque ? formData.estoque : 0,
      fotos: sanitizePhotoUrls(finalPhotos)
        .map(toPhotoStorageValue)
        .filter((value) => value.length > 0),
    };

    const parsed = produtoSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Dados inválidos');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const result = await cnpjProdutosService.atualizar({
          id: editing.id,
          ...parsed.data,
        });

        if (!result.success) {
          toast.error(result.error || 'Erro ao atualizar produto');
          return;
        }

        toast.success('Produto atualizado com sucesso');
      } else {
        const createPayload = {
          module_id: MODULE_ID,
          cnpj: parsed.data.cnpj,
          nome_empresa: parsed.data.nome_empresa,
          nome_produto: parsed.data.nome_produto,
          sku: parsed.data.sku,
          categoria: parsed.data.categoria,
          codigo_barras: parsed.data.codigo_barras,
          controlar_estoque: parsed.data.controlar_estoque,
          fotos: parsed.data.fotos,
          preco: parsed.data.preco,
          estoque: parsed.data.estoque,
          status: parsed.data.status,
        };

        const result = await cnpjProdutosService.criar({
          ...createPayload,
        });

        if (!result.success) {
          toast.error(result.error || 'Erro ao cadastrar produto');
          return;
        }

        toast.success('Produto cadastrado com sucesso');
      }

      resetForm();
      await loadProdutos();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (produto: CnpjProduto) => {
    const normalizedPhotos = normalizeProductPhotos(produto.fotos, produto.fotos_json);
    const existingDescription =
      ((produto as CnpjProduto & { descricao_produto?: string; descricao?: string }).descricao_produto ||
        (produto as CnpjProduto & { descricao_produto?: string; descricao?: string }).descricao ||
        '')
        .toString();

    setEditing(produto);
    setFormData({
      cnpj: produto.cnpj,
      nome_empresa: produto.nome_empresa,
      nome_produto: produto.nome_produto,
      sku: produto.sku || '',
      categoria: produto.categoria || '',
      codigo_barras: produto.codigo_barras || '',
      controlar_estoque: produto.controlar_estoque === true || produto.controlar_estoque === 1,
      fotos: normalizedPhotos,
      preco: Number(produto.preco || 0),
      estoque: Number(produto.estoque || 0),
      status: produto.status,
    });
    setDescricaoProdutoHtml(existingDescription);
    setProductPhotos(toPhotoSlots(normalizedPhotos));
    setPendingPhotoFiles(createEmptyFileSlots());

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedPhotosCount = useMemo(
    () =>
      productPhotos.reduce((count, photo, index) => {
        const hasRemotePhoto = photo.trim().length > 0;
        const hasPendingFile = pendingPhotoFiles[index] instanceof File;
        return count + (hasRemotePhoto || hasPendingFile ? 1 : 0);
      }, 0),
    [productPhotos, pendingPhotoFiles]
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await cnpjProdutosService.excluir(deleteTarget.id);
      if (!result.success) {
        toast.error(result.error || 'Erro ao excluir produto');
        return;
      }

      toast.success('Produto excluído com sucesso');
      setDeleteTarget(null);
      await loadProdutos();
    } finally {
      setDeleting(false);
    }
  };

  const openFormScanner = () => {
    setScannerTarget('form');
    setScannerOpen(true);
  };

  const openSearchScanner = () => {
    setScannerTarget('search');
    setScannerOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0 max-w-full overflow-x-hidden">
      <DashboardTitleCard
        title="CNPJ Produtos"
        subtitle="Controle completo de produtos das empresas"
        icon={<Package className="h-4 w-4 sm:h-5 sm:w-5" />}
        right={
          <>
            <Badge variant="secondary" className="text-xs">
              Módulo #{MODULE_ID}
            </Badge>
            <Button variant="ghost" size="sm" onClick={loadProdutos} disabled={loading} className="h-8 w-8 p-0">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">{editing ? 'Editar Produto' : 'Cadastro de Produto'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input id="cnpj" value={formData.cnpj} readOnly disabled placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="empresa">Empresa *</Label>
                <Input id="empresa" value={formData.nome_empresa} readOnly disabled placeholder="Nome da empresa" />
              </div>
            </div>

            {!canUseUserCompanyData && (
              <p className="text-sm text-destructive">
                Preencha CNPJ e nome da empresa em Dados Pessoais para liberar o cadastro de produtos.
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="produto">Produto *</Label>
                <Input id="produto" value={formData.nome_produto} onChange={(e) => setFormData((prev) => ({ ...prev, nome_produto: e.target.value }))} placeholder="Nome do produto" />
              </div>
              <div className="space-y-3">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={formData.sku || ''} onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))} placeholder="Código interno" />

                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="codigo_barras">Código de barras</Label>
                    <Input
                      id="codigo_barras"
                      value={formData.codigo_barras || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, codigo_barras: e.target.value.replace(/\s+/g, '') }))}
                      placeholder="Ex: 7891234567890"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="button" variant="outline" className="w-full md:w-auto" onClick={openFormScanner}>
                      <ScanLine className="h-4 w-4" />
                      Escanear
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <ProductDescriptionEditor
              value={descricaoProdutoHtml}
              onChange={setDescricaoProdutoHtml}
              disabled={saving || uploadingPhotos}
            />

            <ProductDataPanel />

            <div className="flex items-end gap-2">
              <Button onClick={handleSave} disabled={saving || uploadingPhotos} className="w-full md:w-auto">
                {uploadingPhotos
                  ? 'Enviando fotos...'
                  : saving
                    ? (editing ? 'Atualizando...' : 'Salvando...')
                    : editing
                      ? 'Atualizar produto'
                      : 'Cadastrar produto'}
              </Button>
              {editing && (
                <Button variant="outline" onClick={resetForm} disabled={saving}>
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Publicar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value: ProdutoStatus) => setFormData((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Visibilidade no catálogo</Label>
                <Select
                  value={catalogVisibility}
                  onValueChange={(value: 'loja_busca' | 'somente_loja' | 'somente_busca' | 'oculto') => setCatalogVisibility(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loja_busca">Loja e resultados de pesquisa</SelectItem>
                    <SelectItem value="somente_loja">Apenas na loja</SelectItem>
                    <SelectItem value="somente_busca">Apenas nos resultados de pesquisa</SelectItem>
                    <SelectItem value="oculto">Oculto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={handleSave} disabled={saving || uploadingPhotos}>
                  {editing ? 'Atualizar produto' : 'Publicar'}
                </Button>
                <Button variant="outline" onClick={resetForm} disabled={saving || uploadingPhotos}>
                  Salvar como rascunho
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Imagem do produto</CardTitle>
            </CardHeader>
            <CardContent>
              {productPhotos[0] ? (
                <img src={productPhotos[0]} alt="Imagem principal do produto" loading="lazy" className="h-40 w-full rounded-md object-cover border" />
              ) : (
                <div className="h-40 w-full rounded-md border bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
                  Defina a primeira imagem na galeria abaixo
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Galeria de imagens do produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="fotos">Fotos do produto (até 5)</Label>
                <span className="text-xs text-muted-foreground">{selectedPhotosCount}/5</span>
              </div>
              <p className="text-xs text-muted-foreground">A primeira imagem enviada será usada como imagem principal do produto.</p>
              <ProductPhotoUploader
                key={editing ? `produto-fotos-${editing.id}` : 'produto-fotos-novo'}
                photos={productPhotos}
                uploading={uploadingPhotos}
                onUpload={handleUploadPhotoSlot}
                onRemove={(slotIndex) => {
                  setProductPhotos((prev) => {
                    const next = toPhotoSlots(prev);
                    next[slotIndex] = '';
                    return next;
                  });
                  setPendingPhotoFiles((prev) => {
                    const next = [...prev];
                    next[slotIndex] = null;
                    return next;
                  });
                }}
              />
              {uploadingPhotos && <p className="text-xs text-muted-foreground">Enviando foto...</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Categorias de produto</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductCategorySelector
                value={formData.categoria || ''}
                onChange={(category) => setFormData((prev) => ({ ...prev, categoria: category }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tags de produto</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductTagSelector
                value={tagsProduto}
                onChange={setTagsProduto}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Marcas</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductBrandSelector
                value={marcaProduto}
                onChange={setMarcaProduto}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Imagem externa em destaque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <Label htmlFor="external-featured-image">URL da imagem</Label>
              <Input
                id="external-featured-image"
                type="url"
                value={externalFeaturedImageUrl}
                onChange={(e) => setExternalFeaturedImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">Gerenciamento de Produtos</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="h-4 w-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                   placeholder="Buscar por produto, empresa, SKU ou código"
                  className="pl-8 w-full sm:w-[280px]"
                />
              </div>
              <Button type="button" variant="outline" onClick={openSearchScanner}>
                <ScanLine className="h-4 w-4" />
                Escanear
              </Button>
              <Select value={statusFilter} onValueChange={(value: 'todos' | ProdutoStatus) => setStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadProdutos} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                onClick={() => {
                  resetForm();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <Plus className="h-4 w-4" />
                Novo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 max-w-full overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Carregando produtos...</div>
          ) : produtos.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</div>
          ) : (
            <>
              <div className="md:hidden space-y-3 p-3">
                {produtos.map((produto) => {
                  const firstPhoto = normalizeProductPhotos(produto.fotos, produto.fotos_json)[0];

                  return (
                    <div key={produto.id} className="rounded-md border p-3 space-y-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {firstPhoto ? (
                          <img
                            src={firstPhoto}
                            alt={`Foto do produto ${produto.nome_produto}`}
                            loading="lazy"
                            className="h-14 w-14 rounded object-cover border shrink-0"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded border bg-muted/40 flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
                            Sem foto
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{produto.nome_produto}</p>
                          <p className="text-xs text-muted-foreground truncate">{produto.nome_empresa}</p>
                          <p className="text-xs text-muted-foreground truncate">{produto.sku || 'Sem SKU'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded border p-2">
                          <p className="text-muted-foreground">Preço</p>
                          <p className="font-medium">R$ {Number(produto.preco).toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="rounded border p-2">
                          <p className="text-muted-foreground">Estoque</p>
                          <p className="font-medium">{produto.controlar_estoque === true || produto.controlar_estoque === 1 ? produto.estoque : '—'}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={produto.status === 'ativo' ? 'default' : 'secondary'}>{statusLabel[produto.status]}</Badge>
                        <div className="inline-flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(produto)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(produto)} title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Foto</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Empresa / CNPJ</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.map((produto) => {
                      const firstPhoto = normalizeProductPhotos(produto.fotos, produto.fotos_json)[0];

                      return (
                        <TableRow key={produto.id}>
                          <TableCell>
                            {firstPhoto ? (
                              <img
                                src={firstPhoto}
                                alt={`Foto do produto ${produto.nome_produto}`}
                                loading="lazy"
                                className="h-12 w-12 rounded object-cover border"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded border bg-muted/40 flex items-center justify-center text-[10px] text-muted-foreground">
                                Sem foto
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">#{produto.id}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{produto.nome_empresa}</span>
                              <span className="text-xs text-muted-foreground">{produto.cnpj}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{produto.nome_produto}</span>
                              <span className="text-xs text-muted-foreground">{produto.sku || 'Sem SKU'}</span>
                              <span className="text-xs text-muted-foreground">{produto.codigo_barras || 'Sem código de barras'}</span>
                            </div>
                          </TableCell>
                          <TableCell>R$ {Number(produto.preco).toFixed(2).replace('.', ',')}</TableCell>
                          <TableCell>{produto.controlar_estoque === true || produto.controlar_estoque === 1 ? produto.estoque : '—'}</TableCell>
                          <TableCell>
                            <Badge variant={produto.status === 'ativo' ? 'default' : 'secondary'}>{statusLabel[produto.status]}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(produto)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(produto)} title="Excluir">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-semibold">{resumo.total}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm text-muted-foreground">Ativos</span>
              <span className="font-semibold">{resumo.ativos}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm text-muted-foreground">Rascunho</span>
              <span className="font-semibold">{resumo.rascunho}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm text-muted-foreground">Baixo estoque (≤ 5)</span>
              <span className="font-semibold">{resumo.baixoEstoque}</span>
            </div>
          </div>
          <div className="pt-1 text-xs text-muted-foreground">
            {isAdmin ? 'Você está vendo produtos de todos os usuários.' : 'Você está vendo apenas seus produtos.'}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir produto</DialogTitle>
            <DialogDescription>
              Essa ação vai remover o produto da listagem ativa. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 text-sm">
            <div className="font-medium">{deleteTarget?.nome_produto}</div>
            <div className="text-muted-foreground">{deleteTarget?.nome_empresa}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ler código de barras</DialogTitle>
            <DialogDescription>
              {scannerTarget === 'search'
                ? 'Use a câmera para escanear e preencher automaticamente a busca de produtos.'
                : 'Use a webcam ou câmera do celular para escanear e preencher automaticamente o campo.'}
            </DialogDescription>
          </DialogHeader>

          <BarcodeScanner
            onDetected={(value) => {
              if (scannerTarget === 'search') {
                setSearch(value);
                toast.success('Código aplicado na busca');
              } else {
                setFormData((prev) => ({ ...prev, codigo_barras: value }));
                toast.success('Código de barras capturado');
              }
              setScannerOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CnpjProdutos;
