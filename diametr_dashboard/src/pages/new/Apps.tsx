import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { BoxIcon, DownloadIcon, PlusIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import { useModal } from "../../hooks/useModal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { Modal } from "../../components/ui/modal";
import { useCallback, useState } from "react";
import FileInput from "../../components/form/input/FileInput";
import Select from "../../components/form/Select";
import axiosClient from "../../service/axios.service";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { LoadSpinner } from "../../components/spinner/load-spinner";
import AppsTable from "../../components/tables/new/apps";
export interface App {
  fullname: string;
  phone: string;
}
export default function AppsPage() {
  const { isOpen, openModal, closeModal } = useModal();
  const handleAdding = () => {
    // Handle save logic here

    console.log("handleAdding...");

    closeModal();
    setApp(emptyApp);
  };
  let emptyApp: App = {
    fullname: "",
    phone: "+998901234567",
  };
  let [App, setApp] = useState<App>(emptyApp);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
    }
  };
  const all_merchant_options = [
    { value: "Artel", label: "Artel" },
    { value: "Idea", label: "Idea" },
    { value: "MediaPark", label: "MediaPark" },
  ];

  const all_fillial_options = [
    { value: "Artel 1", label: "Artel 1" },
    { value: "Idea 1", label: "Idea 1" },
    { value: "MediaPark 1", label: "MediaPark 1" },
  ];

  const fetchApps = useCallback(() => {
    return axiosClient.get("/app/all").then((res) => res.data);
  }, []);

  const { data, isLoading, error, refetch } = useFetchWithLoader({
    fetcher: fetchApps,
  });

   let [merchants, setmerchants] = useState<HTMLOptionElement[]>([]);
  const fetchmerchants = useCallback(() => {
    return axiosClient.get('/merchant/all').then(res => res.data);
  }, []);

   const { data: groups, isLoading: isLoadingGroups, error: errorIsGroups, refetch: refetchGroups } = useFetchWithLoader({
    fetcher: fetchmerchants,
    onSuccess: useCallback((data: any[]) => {
      setmerchants((data as any[]).map((e, index) => {
        return new Option(`${e.name}`, `${e.id}`)
      }));
      
    }, [])
  });




   let [fillials, setfillials] = useState<HTMLOptionElement[]>([]);
  const fetchfillials = useCallback(() => {
    return axiosClient.get('/fillial/all').then(res => res.data);
  }, []);

   const {  } = useFetchWithLoader({
    fetcher: fetchfillials,
    onSuccess: useCallback((data: any[]) => {
      setfillials((data as any[]).map((e, index) => {
        return new Option(`${e.name}`, `${e.id}`)
      }));
      
    }, [])
  });

  return (
    <>
      <PageMeta
        title="Apps | Diametr Dashboard"
        description="Diametr Dashboard"
      />
      <PageBreadcrumb pageTitle="Arizalar" />

      <div className="space-y-6 ">
        {isLoading && (
          <div className="min-h-[450px]  flex-col flex justify-center">
            <LoadSpinner />
          </div>
        )}
        {data && (
          <ComponentCard
            title="Arizalar Jadvali"
            
          >
            <AppsTable data={data} refetch={refetch} merchants={merchants} fillials={fillials}/>
          </ComponentCard>
        )}
      </div>
    </>
  );
}
