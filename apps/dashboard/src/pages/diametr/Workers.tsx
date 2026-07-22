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
import WorkersTable, { WorkerItemProps } from "../../components/tables/diametr/workersTable";
import { usePolling } from "../../hooks/usePolling";
import { toast } from "../../components/ui/toast";

export interface Worker {
  fullname?: string;
  phone?: string;
  service_id?: string;
  expired?: string;
}
export default function WorkersPage() {
  const { isOpen, openModal, closeModal } = useModal();
  const emptyWorker: Worker = { fullname: "", phone: "", service_id: "", expired: "" };
  const [Worker, setWorker] = useState<Worker>(emptyWorker);
  const [saving, setSaving] = useState(false);

  const fetchWorkers = useCallback(
    () => axiosClient.get("/worker/all").then((res) => res.data), []);
  const { data, isLoading, refetch } = useFetchWithLoader<WorkerItemProps[]>({ fetcher: fetchWorkers });
  usePolling(refetch, 15_000);
  const workersData: WorkerItemProps[] = Array.isArray(data) ? data : [];

  const fetchServices = useCallback(
    () => axiosClient.get("/service/all").then((res) => res.data), []);
  const { data: svcData } = useFetchWithLoader<{ id: number; name: string }[]>({ fetcher: fetchServices });
  const service_options = Array.isArray(svcData)
    ? svcData.map((s) => ({ value: String(s.id), label: s.name }))
    : [];

  const handleAdding = async () => {
    if (!Worker.fullname || !Worker.phone || !Worker.service_id || !Worker.expired) {
      toast.error("Barcha maydonlarni toldirib, muddat kiriting");
      return;
    }
    setSaving(true);
    try {
      await axiosClient.post("/worker", {
        fullname: Worker.fullname,
        phone: Worker.phone,
        service_id: Number(Worker.service_id),
        expired: Worker.expired,
      });
      toast.success("Ishchi qoshildi");
      refetch(); closeModal(); setWorker(emptyWorker);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xatolik yuz berdi");
    } finally { setSaving(false); }
  };

  return (
    <>
      <PageMeta title="Workers | Diametr Dashboard" description="Diametr Dashboard" />
      <PageBreadcrumb pageTitle="Workers" />
      <div className="space-y-6">
        <ComponentCard title="Workers Table" action={
            <Button size="sm" variant="primary" startIcon={<PlusIcon className="size-5 fill-white" />} onClick={() => { setWorker(emptyWorker); openModal(); }}>
              Add Worker
            </Button>
          }>
          {isLoading ? <SkeletonTable cols={6} rows={7} /> : <WorkersTable data={workersData} onRefetch={refetch} />}
        </ComponentCard>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Add Worker</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">Yangi ishchi qoshish.</p>
          </div>
          <form className="flex flex-col">
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Toliq ismi</Label>
                  <Input type="text" placeholder="Masalan: Jasur Toshmatov" value={Worker.fullname} onChange={(e) => setWorker({ ...Worker, fullname: e.target.value })} />
                </div>
                <div>
                  <Label>Telefon</Label>
                  <Input type="text" placeholder="+998901234567" value={Worker.phone} onChange={(e) => setWorker({ ...Worker, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Xizmat turi</Label>
                  <Select options={service_options} className="dark:bg-dark-900" placeholder="Xizmatni tanlang" onChange={(v) => setWorker({ ...Worker, service_id: v })} />
                </div>
                <div>
                  <Label>Muddat (yyyy-MM-dd)</Label>
                  <Input type="date" value={Worker.expired} onChange={(e) => setWorker({ ...Worker, expired: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>Close</Button>
              <Button size="sm" onClick={handleAdding} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}