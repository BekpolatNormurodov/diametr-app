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
import StatisticsTable from "../../components/tables/new/statistics";
import FileInput from "../../components/form/input/FileInput";
import Select from "../../components/form/Select";
import axiosClient from "../../service/axios.service";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { LoadSpinner } from "../../components/spinner/load-spinner";
export interface Statistic {
  name?: string;
  image?: string;
}
export default function StatisticsPage() {
  const { isOpen, openModal, closeModal } = useModal();
  const handleAdding = () => {
    // Handle save logic here

    console.log("handleAdding...");

    closeModal();
    setStatistic(emptyStatistic);
  };
  let emptyStatistic: Statistic = {
    name: "",
    image: "",
  };

  let [percent, setPercent] = useState("38");

  let [percent_type, setPercentType] = useState("OUT");

  let [Statistic, setStatistic] = useState<Statistic>(emptyStatistic);

  const region_options = [
    { value: "Toshkent sh", label: "Toshkent sh" },
    { value: "Andijon", label: "Andijon" },
    { value: "Buxoro", label: "Buxoro" },
    { value: "Farg'ona", label: "Farg'ona" },
    { value: "Jizzax", label: "Jizzax" },
    { value: "Samarqand", label: "Samarqand" },
    { value: "Toshkent", label: "Toshkent" },

  ];



   const fetchStatistics = useCallback(() => {
    return axiosClient.get("/fillial/statistics").then((res) => res.data);
  }, []);

  const { data, isLoading, error, refetch } = useFetchWithLoader({
    fetcher: fetchStatistics,
  });


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
    }
  };


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
  return (
    <>
      <PageMeta
        title="Statistics | Diametr Dashboard"
        description="Diametr Dashboard"
      />
      <PageBreadcrumb pageTitle="Statistics" />
   
       <div className="space-y-6 ">
        {isLoading && (
                 <div className="min-h-[450px]  flex-col flex justify-center">
                   <LoadSpinner />
                 </div>
               )}
       
       
         {
          data && <ComponentCard
          title="Statistics Table"
          
        >
          <StatisticsTable data={data} refetch={refetch} merchants={merchants}/>
        </ComponentCard>
         }
      </div>
   
    </>
  );
}
