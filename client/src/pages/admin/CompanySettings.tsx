import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Trash2 } from "lucide-react";

const toast = (options: any) => {
  console.log(options);
  alert(options.title);
};

interface BusinessHours {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export default function CompanySettings() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([
    { dayOfWeek: 0, isOpen: true, openTime: "17:00", closeTime: "00:00" },
    { dayOfWeek: 1, isOpen: true, openTime: "17:00", closeTime: "00:00" },
    { dayOfWeek: 2, isOpen: true, openTime: "17:00", closeTime: "00:00" },
    { dayOfWeek: 3, isOpen: true, openTime: "17:00", closeTime: "00:00" },
    { dayOfWeek: 4, isOpen: true, openTime: "17:00", closeTime: "00:00" },
    { dayOfWeek: 5, isOpen: true, openTime: "17:00", closeTime: "00:00" },
    { dayOfWeek: 6, isOpen: true, openTime: "17:00", closeTime: "00:00" },
  ]);

  // Company info
  const { data: companyInfo, refetch: refetchCompany } = trpc.company.getInfo.useQuery();
  const updateCompanyMutation = trpc.company.updateInfo.useMutation();
  const uploadLogoMutation = trpc.company.uploadLogo.useMutation();

  // Promotions
  const { data: promotions = [], refetch: refetchPromotions } = trpc.promotions.getAll.useQuery();
  const createPromotionMutation = trpc.promotions.create.useMutation();
  const updatePromotionMutation = trpc.promotions.update.useMutation();
  const deletePromotionMutation = trpc.promotions.delete.useMutation();

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
      if (companyInfo.businessHours && Array.isArray(companyInfo.businessHours)) {
        setBusinessHours(companyInfo.businessHours);
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

  const handleUpdateBusinessHours = async () => {
    try {
      await updateCompanyMutation.mutateAsync({
        ...companyForm,
        businessHours,
      });
      await refetchCompany();
      toast({ title: "Horários de funcionamento atualizados!" });
    } catch (error) {
      toast({ title: "Erro ao atualizar horários", variant: "destructive" });
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
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold">Configurações da Empresa</h1>
        <p className="text-muted-foreground">Gerencie informações, horários e promoções</p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="company" className="text-xs sm:text-sm">Empresa</TabsTrigger>
          <TabsTrigger value="hours" className="text-xs sm:text-sm">Horários</TabsTrigger>
          <TabsTrigger value="promotions" className="text-xs sm:text-sm">Promoções</TabsTrigger>
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
                <div className="flex gap-4 items-start flex-col sm:flex-row">
                  {logoPreview && (
                    <img src={logoPreview} alt="Logo" className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 w-full">
                    <label htmlFor="logo-upload" className="cursor-pointer block">
                      <div className="border-2 border-dashed rounded-lg p-4 hover:bg-accent transition text-center">
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
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    className="text-sm"
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
                  className="text-sm"
                />
              </div>

              <Button onClick={handleUpdateCompany} disabled={updateCompanyMutation.isPending} className="w-full sm:w-auto">
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
              <CardDescription>Configure os horários por dia da semana</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {businessHours.map((hours, idx) => (
                  <div key={hours.dayOfWeek} className="border rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="font-semibold text-sm">{dayLabels[hours.dayOfWeek.toString()]}</Label>
                      <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={hours.isOpen}
                          onChange={(e) => {
                            const updated = [...businessHours];
                            updated[idx].isOpen = e.target.checked;
                            setBusinessHours(updated);
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-xs">Aberto</span>
                      </label>
                    </div>
                    {hours.isOpen && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor={`open-${idx}`} className="text-xs">Abre</Label>
                          <Input
                            id={`open-${idx}`}
                            type="time"
                            value={hours.openTime}
                            onChange={(e) => {
                              const updated = [...businessHours];
                              updated[idx].openTime = e.target.value;
                              setBusinessHours(updated);
                            }}
                            className="text-xs h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`close-${idx}`} className="text-xs">Fecha</Label>
                          <Input
                            id={`close-${idx}`}
                            type="time"
                            value={hours.closeTime}
                            onChange={(e) => {
                              const updated = [...businessHours];
                              updated[idx].closeTime = e.target.value;
                              setBusinessHours(updated);
                            }}
                            className="text-xs h-8"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={handleUpdateBusinessHours} disabled={updateCompanyMutation.isPending} className="w-full">
                {updateCompanyMutation.isPending ? "Salvando..." : "Salvar Horários"}
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
                  placeholder="Ex: Mega Promoção"
                  value={promotionForm.title}
                  onChange={(e) => setPromotionForm({ ...promotionForm, title: e.target.value })}
                  className="text-sm"
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
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="discount">Desconto %</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={promotionForm.discountPercentage}
                    onChange={(e) => setPromotionForm({ ...promotionForm, discountPercentage: parseInt(e.target.value) })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Data Início</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={promotionForm.startDate}
                    onChange={(e) => setPromotionForm({ ...promotionForm, startDate: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Data Fim</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={promotionForm.endDate}
                    onChange={(e) => setPromotionForm({ ...promotionForm, endDate: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>

              <Button onClick={handleCreatePromotion} disabled={createPromotionMutation.isPending} className="w-full">
                {createPromotionMutation.isPending ? "Criando..." : "Criar Promoção"}
              </Button>
            </CardContent>
          </Card>

          {/* Promotions List */}
          {promotions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Promoções Ativas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {promotions.map((promo: any) => (
                  <div key={promo.id} className="border rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{promo.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{promo.description}</p>
                        {promo.discountPercentage && (
                          <p className="text-xs font-medium text-green-600 mt-1">{promo.discountPercentage}% OFF</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePromotion(promo.id)}
                        disabled={deletePromotionMutation.isPending}
                        className="text-red-500 hover:text-red-700 flex-shrink-0 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
