import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Plus, Trash2 } from "lucide-react";

const toast = (options: any) => {
  console.log(options);
  alert(options.title);
};

export default function CompanySettings() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);

  // Company info
  const { data: companyInfo, refetch: refetchCompany } = trpc.company.getInfo.useQuery();
  const updateCompanyMutation = trpc.company.updateInfo.useMutation();
  const uploadLogoMutation = trpc.company.uploadLogo.useMutation();

  // Promotions
  const { data: promotions = [], refetch: refetchPromotions } = trpc.promotions.getAll.useQuery();
  const createPromotionMutation = trpc.promotions.create.useMutation();
  const updatePromotionMutation = trpc.promotions.update.useMutation();
  const deletePromotionMutation = trpc.promotions.delete.useMutation();
  const uploadPromotionImageMutation = trpc.promotions.uploadImage.useMutation();

  // Shop settings
  const { data: shopSettings, refetch: refetchShopSettings } = trpc.shop.settings.useQuery();
  const updateShopSettingsMutation = trpc.shop.updateSettings.useMutation();

  const [companyForm, setCompanyForm] = useState({
    name: companyInfo?.name || "LV BURGER",
    description: companyInfo?.description || "",
    phone: companyInfo?.phone || "",
    email: companyInfo?.email || "",
    address: companyInfo?.address || "",
  });

  const [shopForm, setShopForm] = useState({
    openTime: shopSettings?.openTime || "17:00",
    closeTime: shopSettings?.closeTime || "00:00",
    operatingDays: shopSettings?.operatingDays || "2,3,4,5,6,0",
  });

  const [promotionForm, setPromotionForm] = useState({
    title: "",
    description: "",
    discountPercentage: 0,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  useEffect(() => {
    if (companyInfo) {
      setCompanyForm({
        name: companyInfo.name || "LV BURGER",
        description: companyInfo.description || "",
        phone: companyInfo.phone || "",
        email: companyInfo.email || "",
        address: companyInfo.address || "",
      });
      if (companyInfo.logoUrl) {
        setLogoPreview(companyInfo.logoUrl);
      }
    }
  }, [companyInfo]);

  useEffect(() => {
    if (shopSettings) {
      setShopForm({
        openTime: shopSettings.openTime || "17:00",
        closeTime: shopSettings.closeTime || "00:00",
        operatingDays: shopSettings.operatingDays || "2,3,4,5,6,0",
      });
    }
  }, [shopSettings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const base64Data = base64.split(",")[1];

      try {
        const result = await uploadLogoMutation.mutateAsync({
          base64: base64Data,
          mimeType: file.type,
        });
        setLogoPreview(result.url);
        toast({ title: "Logo atualizada com sucesso!" });
      } catch (error) {
        toast({ title: "Erro ao fazer upload da logo", variant: "destructive" });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateCompany = async () => {
    try {
      await updateCompanyMutation.mutateAsync(companyForm);
      await refetchCompany();
      toast({ title: "Informações da empresa atualizadas!" });
    } catch (error) {
      toast({ title: "Erro ao atualizar informações", variant: "destructive" });
    }
  };

  const handleUpdateShopSettings = async () => {
    try {
      await updateShopSettingsMutation.mutateAsync(shopForm);
      await refetchShopSettings();
      toast({ title: "Horários atualizados com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao atualizar horários", variant: "destructive" });
    }
  };

  const handleCreatePromotion = async () => {
    if (!promotionForm.title || !promotionForm.description) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    try {
      await createPromotionMutation.mutateAsync({
        ...promotionForm,
        startDate: new Date(promotionForm.startDate),
        endDate: new Date(promotionForm.endDate),
      });
      await refetchPromotions();
      setPromotionForm({
        title: "",
        description: "",
        discountPercentage: 0,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
      toast({ title: "Promoção criada com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao criar promoção", variant: "destructive" });
    }
  };

  const handleDeletePromotion = async (id: number) => {
    try {
      await deletePromotionMutation.mutateAsync({ id });
      await refetchPromotions();
      toast({ title: "Promoção deletada!" });
    } catch (error) {
      toast({ title: "Erro ao deletar promoção", variant: "destructive" });
    }
  };

  const dayLabels: Record<string, string> = {
    "0": "Domingo",
    "1": "Segunda",
    "2": "Terça",
    "3": "Quarta",
    "4": "Quinta",
    "5": "Sexta",
    "6": "Sábado",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações da Empresa</h1>
        <p className="text-muted-foreground">Gerencie informações, horários e promoções</p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="hours">Horários</TabsTrigger>
          <TabsTrigger value="promotions">Promoções</TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>Edite os dados da sua hamburgueria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo da Empresa</Label>
                <div className="flex gap-4 items-start">
                  {logoPreview && (
                    <img src={logoPreview} alt="Logo" className="w-24 h-24 rounded-lg object-cover" />
                  )}
                  <div>
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed rounded-lg p-4 hover:bg-accent transition">
                        <Upload className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-sm font-medium">Clique para fazer upload</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG até 5MB</p>
                      </div>
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={uploadLogoMutation.isPending}
                    />
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa</Label>
                  <Input
                    id="name"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={companyForm.description}
                  onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                  rows={4}
                />
              </div>

              <Button onClick={handleUpdateCompany} disabled={updateCompanyMutation.isPending}>
                {updateCompanyMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Horários de Funcionamento</CardTitle>
              <CardDescription>Configure quando sua loja está aberta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openTime">Horário de Abertura</Label>
                  <Input
                    id="openTime"
                    type="time"
                    value={shopForm.openTime}
                    onChange={(e) => setShopForm({ ...shopForm, openTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closeTime">Horário de Fechamento</Label>
                  <Input
                    id="closeTime"
                    type="time"
                    value={shopForm.closeTime}
                    onChange={(e) => setShopForm({ ...shopForm, closeTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dias de Funcionamento</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(dayLabels).map(([day, label]) => (
                    <label key={day} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shopForm.operatingDays.split(",").includes(day)}
                        onChange={(e) => {
                          let days = shopForm.operatingDays.split(",");
                          if (e.target.checked) {
                            days.push(day);
                          } else {
                            days = days.filter((d: string) => d !== day);
                          }
                          setShopForm({ ...shopForm, operatingDays: days.join(",") });
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleUpdateShopSettings} disabled={updateShopSettingsMutation.isPending}>
                {updateShopSettingsMutation.isPending ? "Salvando..." : "Salvar Horários"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promotions" className="space-y-4">
          {/* Create Promotion */}
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Promoção</CardTitle>
              <CardDescription>Adicione um anúncio de promoção</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promo-title">Título</Label>
                <Input
                  id="promo-title"
                  placeholder="Ex: Mega Promoção de Hamburgueres"
                  value={promotionForm.title}
                  onChange={(e) => setPromotionForm({ ...promotionForm, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo-desc">Descrição</Label>
                <Textarea
                  id="promo-desc"
                  placeholder="Descreva a promoção"
                  value={promotionForm.description}
                  onChange={(e) => setPromotionForm({ ...promotionForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="promo-discount">Desconto (%)</Label>
                  <Input
                    id="promo-discount"
                    type="number"
                    value={promotionForm.discountPercentage}
                    onChange={(e) =>
                      setPromotionForm({ ...promotionForm, discountPercentage: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-start">Data Início</Label>
                  <Input
                    id="promo-start"
                    type="date"
                    value={promotionForm.startDate}
                    onChange={(e) => setPromotionForm({ ...promotionForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-end">Data Fim</Label>
                  <Input
                    id="promo-end"
                    type="date"
                    value={promotionForm.endDate}
                    onChange={(e) => setPromotionForm({ ...promotionForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleCreatePromotion} disabled={createPromotionMutation.isPending} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                {createPromotionMutation.isPending ? "Criando..." : "Criar Promoção"}
              </Button>
            </CardContent>
          </Card>

          {/* Promotions List */}
          {promotions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Promoções Ativas</h3>
              {promotions.map((promo: any) => (
                <Card key={promo.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{promo.title}</h4>
                        <p className="text-sm text-muted-foreground">{promo.description}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          {promo.discountPercentage && (
                            <span className="text-green-600 font-medium">{promo.discountPercentage}% OFF</span>
                          )}
                          <span className="text-muted-foreground">
                            {new Date(promo.startDate).toLocaleDateString()} -{" "}
                            {new Date(promo.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePromotion(promo.id)}
                        disabled={deletePromotionMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {promotions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma promoção criada ainda</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
