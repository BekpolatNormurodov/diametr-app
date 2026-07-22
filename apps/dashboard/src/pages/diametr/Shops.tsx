import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

import { PlusIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import { useModal } from "../../hooks/useModal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { Modal } from "../../components/ui/modal";
import { useCallback, useEffect, useRef, useState } from "react";
import ShopsTable, {
  ShopItemProps,
} from "../../components/tables/diametr/shopsTable";
import Select from "../../components/form/Select";
import axiosClient from "../../service/axios.service";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { SkeletonTable } from "../../components/spinner/load-spinner";
import { usePolling } from "../../hooks/usePolling";
import ImageField, { ImageFieldResult } from "../../components/common/ImageField";
import { toast } from "../../components/ui/toast";

export interface Shop {
  name?: string;
  region_id?: number;
  address?: string;
  mfo?: string;
  inn?: string;
  hisob_raqam?: string;
  director_name?: string;
  director_phone?: string;
  image?: string;
  lat?: string;
  lon?: string;
}

export default function ShopsPage() {
  const { isOpen, openModal, closeModal } = useModal();

  const emptyShop: Shop = {
    name: "", region_id: undefined, address: "",
    mfo: "", inn: "", hisob_raqam: "",
    director_name: "", director_phone: "", image: "",
    lat: "", lon: "",
  };

  const [shopForm, setShopForm] = useState<Shop>(emptyShop);
  const imageResultRef = useRef<ImageFieldResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [trialMonths, setTrialMonths] = useState(2);
  const [regionOptions, setRegionOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    axiosClient
      .get("/region/all")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setRegionOptions(
          list.map((r: any) => ({ value: String(r.id), label: r.name ?? r.name_uz ?? `#${r.id}` }))
        );
      })
      .catch(() => setRegionOptions([]));
  }, []);

  const fetchShops = useCallback(
    () => axiosClient.get("/shop/all-admin").then((res) => res.data),
    []
  );
  const { data, isLoading, refetch } = useFetchWithLoader<ShopItemProps[]>({
    fetcher: fetchShops,
  });
  usePolling(refetch, 10_000);

  const shopData: ShopItemProps[] = Array.isArray(data) ? data : [];

  const handleAdding = async () => {
    setSaving(true);
    try {
      let imageFilename = shopForm.image ?? "";
      const imgResult = imageResultRef.current;

      if (imgResult?.mode === "upload" && imgResult.file) {
        const fd = new FormData();
        fd.append("image", imgResult.file);
        const res = await axiosClient.post("/shop/upload-image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageFilename = res.data?.data?.image ?? res.data?.image ?? "";
      } else if (imgResult?.mode === "url" && imgResult.url) {
        const res = await axiosClient.post("/shop/upload-image-url", { url: imgResult.url });
        imageFilename = res.data?.data?.image ?? res.data?.image ?? imgResult.url;
      }

      await axiosClient.post("/shop", {
        name: shopForm.name,
        region_id: shopForm.region_id,
        address: shopForm.address,
        mfo: shopForm.mfo,
        inn: shopForm.inn,
        hisob_raqam: shopForm.hisob_raqam,
        director: shopForm.director_name,
        director_phone: shopForm.director_phone,
        image: imageFilename,
        free_trial_months: trialMonths,
        ...(shopForm.lat ? { lat: Number(shopForm.lat) } : {}),
        ...(shopForm.lon ? { lon: Number(shopForm.lon) } : {}),
      });
      toast.success("Do'kon qo'shildi");
      refetch();
      closeModal();
      setShopForm(emptyShop);
      imageResultRef.current = null;
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const f = (key: keyof Shop) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setShopForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <>
      <PageMeta title="Shops | Diametr Dashboard" description="Diametr Dashboard" />
      <PageBreadcrumb pageTitle="Shops" />

      <div className="space-y-6">
        <ComponentCard
          title="Shops Table"
          action={
            <Button
              size="sm"
              variant="primary"
              startIcon={<PlusIcon className="size-5 fill-white" />}
              onClick={() => { setShopForm(emptyShop); imageResultRef.current = null; setTrialMonths(2); openModal(); }}
            >
              Add Shop
            </Button>
          }
        >
          {isLoading ? <SkeletonTable cols={6} rows={7} /> : <ShopsTable data={shopData ?? []} onRefetch={refetch} />}
        </ComponentCard>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Add Shop</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Create new Shop with full details.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={(e) => { e.preventDefault(); handleAdding(); }}>
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Nomi *</Label>
                  <Input type="text" value={shopForm.name} onChange={f("name")} placeholder="Do'kon nomi" />
                </div>
                <div>
                  <Label>Region</Label>
                  <Select
                    options={regionOptions}
                    className="dark:bg-dark-900"
                    onChange={(v) => setShopForm((prev) => ({ ...prev, region_id: v ? Number(v) : undefined }))}
                  />
                </div>
                <div className="lg:col-span-2">
                  <Label>Manzil</Label>
                  <Input type="text" value={shopForm.address} onChange={f("address")} placeholder="To'liq manzil" />
                </div>
                <div>
                  <Label>Latitude (ixtiyoriy)</Label>
                  <Input type="text" value={shopForm.lat} onChange={f("lat")} placeholder="41.2995" />
                </div>
                <div>
                  <Label>Longitude (ixtiyoriy)</Label>
                  <Input type="text" value={shopForm.lon} onChange={f("lon")} placeholder="69.2401" />
                </div>
                <div>
                  <Label>MFO</Label>
                  <Input type="text" value={shopForm.mfo} onChange={f("mfo")} />
                </div>
                <div>
                  <Label>INN</Label>
                  <Input type="text" value={shopForm.inn} onChange={f("inn")} />
                </div>
                <div>
                  <Label>Hisob raqam</Label>
                  <Input type="text" value={shopForm.hisob_raqam} onChange={f("hisob_raqam")} />
                </div>
                <div>
                  <Label>Direktor ismi</Label>
                  <Input type="text" value={shopForm.director_name} onChange={f("director_name")} />
                </div>
                <div>
                  <Label>Direktor telefoni</Label>
                  <Input type="tel" value={shopForm.director_phone} onChange={f("director_phone")} placeholder="+998..." />
                </div>
                <div className="lg:col-span-2">
                  <ImageField
                    label="Do'kon rasmi"
                    onChange={(result) => { imageResultRef.current = result; }}
                  />
                </div>

                {/* Trial months selector */}
                <div className="lg:col-span-2">
                  <Label>Bepul sinov muddati</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[0, 1, 2, 3, 6, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTrialMonths(m)}
                        className={[
                          "flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                          trialMonths === m
                            ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400 dark:border-brand-500 shadow-sm"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/[0.03]",
                        ].join(" ")}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {m === 0 ? "Yo'q" : `${m} oy`}
                        {m === 2 && <span className="text-xs text-brand-500 dark:text-brand-400">(default)</span>}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">{trialMonths === 0 ? "Bepul sinov berilmaydi — do'kon darhol obuna sotib olishi kerak" : `Do'kon yaratilganda ${trialMonths} oy bepul sinov beriladi`}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal} type="button">Close</Button>
              <Button size="sm" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
