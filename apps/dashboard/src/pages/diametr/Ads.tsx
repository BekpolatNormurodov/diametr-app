import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

import { PlusIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import { useModal } from "../../hooks/useModal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { Modal } from "../../components/ui/modal";
import { useCallback, useState } from "react";

import Select from "../../components/form/Select";
import axiosClient from "../../service/axios.service";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { SkeletonTable } from "../../components/spinner/load-spinner";
import AdsTable, {
  AdItemProps,
} from "../../components/tables/diametr/adsTable";
import { usePolling } from "../../hooks/usePolling";
import { toast } from "../../components/ui/toast";

export interface Ad {
  title?: string;
  subtitle?: string;
  expired?: string;
  type?: string;
  shop_id?: string;
  region_id?: string;
  worker_id?: string;
  product_id?: string;
}

const type_options = [
  { value: "SHOP", label: "Do'kon (SHOP)" },
  { value: "WORKER", label: "Ishchi (WORKER)" },
  { value: "REGION", label: "Region (REGION)" },
  { value: "PRODUCT", label: "Mahsulot (PRODUCT)" },
];

export default function AdsPage() {
  const { isOpen, openModal, closeModal } = useModal();

  const emptyAd: Ad = { title: "", subtitle: "", expired: "", type: "SHOP", shop_id: "", region_id: "", worker_id: "", product_id: "" };
  const [Ad, setAd] = useState<Ad>(emptyAd);
  const [saving, setSaving] = useState(false);

  const fetchAds = useCallback(
    () => axiosClient.get("/ad/all").then((res) => res.data),
    []
  );
  const { data, isLoading, refetch } = useFetchWithLoader<AdItemProps[]>({
    fetcher: fetchAds,
  });
  usePolling(refetch, 15_000);

  const adsData: AdItemProps[] = Array.isArray(data) ? data : [];

  const handleAdding = async () => {
    if (!Ad.title || !Ad.expired || !Ad.type) {
      toast.error("Sarlavha, muddat va tur kiritish shart");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: Ad.title,
        subtitle: Ad.subtitle,
        expired: Ad.expired,
        type: Ad.type,
      };
      if (Ad.type === "SHOP" && Ad.shop_id) body.shop_id = Number(Ad.shop_id);
      if (Ad.type === "REGION" && Ad.region_id) body.region_id = Number(Ad.region_id);
      if (Ad.type === "WORKER" && Ad.worker_id) body.worker_id = Number(Ad.worker_id);
      if (Ad.type === "PRODUCT" && Ad.product_id) body.product_id = Number(Ad.product_id);

      await axiosClient.post("/ad", body);
      toast.success("Reklama qo'shildi");
      refetch();
      closeModal();
      setAd(emptyAd);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta title="Ads | Diametr Dashboard" description="Diametr Dashboard" />
      <PageBreadcrumb pageTitle="Ads" />

      <div className="space-y-6">
        <ComponentCard
          title="Ads Table"
          action={
            <Button
              size="sm"
              variant="primary"
              startIcon={<PlusIcon className="size-5 fill-white" />}
              onClick={() => { setAd(emptyAd); openModal(); }}
            >
              Add Ad
            </Button>
          }
        >
          {isLoading ? <SkeletonTable cols={6} rows={7} /> : <AdsTable data={adsData} onRefetch={refetch} />}
        </ComponentCard>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Add Ad</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">Yangi reklama qo'shish.</p>
          </div>
          <form className="flex flex-col">
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Sarlavha</Label>
                  <Input type="text" placeholder="Reklama sarlavhasi" value={Ad.title} onChange={(e) => setAd({ ...Ad, title: e.target.value })} />
                </div>
                <div>
                  <Label>Tavsif</Label>
                  <Input type="text" placeholder="Qisqacha tavsif" value={Ad.subtitle} onChange={(e) => setAd({ ...Ad, subtitle: e.target.value })} />
                </div>
                <div>
                  <Label>Muddat (yyyy-MM-dd)</Label>
                  <Input type="date" value={Ad.expired} onChange={(e) => setAd({ ...Ad, expired: e.target.value })} />
                </div>
                <div>
                  <Label>Tur</Label>
                  <Select options={type_options} className="dark:bg-dark-900" placeholder="Turni tanlang" onChange={(v) => setAd({ ...Ad, type: v })} />
                </div>
                {Ad.type === "SHOP" && (
                  <div>
                    <Label>Do'kon ID</Label>
                    <Input type="number" placeholder="Do'kon ID raqami" value={Ad.shop_id} onChange={(e) => setAd({ ...Ad, shop_id: e.target.value })} />
                  </div>
                )}
                {Ad.type === "REGION" && (
                  <div>
                    <Label>Region ID</Label>
                    <Input type="number" placeholder="Region ID raqami" value={Ad.region_id} onChange={(e) => setAd({ ...Ad, region_id: e.target.value })} />
                  </div>
                )}
                {Ad.type === "WORKER" && (
                  <div>
                    <Label>Ishchi ID</Label>
                    <Input type="number" placeholder="Ishchi ID raqami" value={Ad.worker_id} onChange={(e) => setAd({ ...Ad, worker_id: e.target.value })} />
                  </div>
                )}
                {Ad.type === "PRODUCT" && (
                  <div>
                    <Label>Mahsulot ID</Label>
                    <Input type="number" placeholder="Mahsulot ID raqami" value={Ad.product_id} onChange={(e) => setAd({ ...Ad, product_id: e.target.value })} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>Close</Button>
              <Button size="sm" onClick={handleAdding} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
