import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

import { BoxIcon, PlusIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import { useModal } from "../../hooks/useModal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { Modal } from "../../components/ui/modal";
import { useCallback, useState } from "react";
import FillialsTable from "../../components/tables/new/fillials";
import FileInput from "../../components/form/input/FileInput";
import Select from "../../components/form/Select";
import axiosClient from "../../service/axios.service";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { LoadSpinner } from "../../components/spinner/load-spinner";
export interface Fillial {
  name?: string;
  image?: string;
}
export default function FillialsPage() {
  const { isOpen, openModal, closeModal } = useModal();
  const handleAdding = () => {
    // Handle save logic here

    console.log("handleAdding...");

    closeModal();
    setFillial(emptyFillial);
  };
  let emptyFillial: Fillial = {
    name: "",
    image: "",
  };

  let [percent, setPercent] = useState("38");

  let [percent_type, setPercentType] = useState("OUT");

  let [Fillial, setFillial] = useState<Fillial>(emptyFillial);

  const region_options = [
    { value: "Toshkent sh", label: "Toshkent sh" },
    { value: "Andijon", label: "Andijon" },
    { value: "Buxoro", label: "Buxoro" },
    { value: "Farg'ona", label: "Farg'ona" },
    { value: "Jizzax", label: "Jizzax" },
    { value: "Samarqand", label: "Samarqand" },
    { value: "Toshkent", label: "Toshkent" },

  ];
  const all_merchant_options = [
    { value: "Artel", label: "Artel" },
    { value: "Idea", label: "Idea" },
    { value: "MediaPark", label: "MediaPark" },
  ];
  const percent_type_options = [
    { value: "OUT", label: "OUT" },
    { value: "IN", label: "IN" },
    
  ];


   const fetchFillials = useCallback(() => {
    return axiosClient.get("/fillial/all").then((res) => res.data);
  }, []);

  const { data, isLoading, error, refetch } = useFetchWithLoader({
    fetcher: fetchFillials,
  });


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
    }
  };
  return (
    <>
      <PageMeta
        title="Fillials | Diametr Dashboard"
        description="Diametr Dashboard"
      />
      <PageBreadcrumb pageTitle="Fillials" />
   
       <div className="space-y-6 ">
        {isLoading && (
                 <div className="min-h-[450px]  flex-col flex justify-center">
                   <LoadSpinner />
                 </div>
               )}
       
       
         {
          data && <ComponentCard
          title="Fillials Table"
          action={
            <>
              <Button
                size="sm"
                variant="primary"
                startIcon={<PlusIcon className="size-5 fill-white" />}
                onClick={()=>{
                  setFillial(emptyFillial)
                  openModal()
                }}
              >
                Add Fillial
              </Button>
            </>
          }
        >
          <FillialsTable data={data} refetch={refetch}/>
        </ComponentCard>
         }
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Add Fillial
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Create new Fillial with full details.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">

                <div>
                  <Label>Region</Label>
                  <Select
                    options={region_options}
                    className="dark:bg-dark-900"
                    onChange={() => { }}

                  />
                </div>

                <div>
                  <Label>Address</Label>
                  <Input
                    type="text"


                  />
                </div>


                <div>
                  <Label>Merchant</Label>
                  <Select
                    options={all_merchant_options}
                    className="dark:bg-dark-900"

                    onChange={() => { }}

                  />
                </div>

                <div>
                  <Label>Name</Label>
                  <Input
                    type="text"
                    value={Fillial.name}
                    onChange={(e) =>
                      setFillial(emptyFillial)
                    }
                  />
                </div>


            


                <div>
                  <Label>Bank name</Label>
                  <Input
                    type="text"

                    onChange={(e) => { }
                    }
                  />
                </div>




                <div>
                  <Label>MFO</Label>
                  <Input
                    type="text"

                    onChange={(e) => { }
                    }
                  />
                </div>
                <div>
                  <Label>INN</Label>
                  <Input
                    type="text"

                    onChange={(e) => { }
                    }
                  />
                </div>


                <div>
                  <Label>Hisob raqam</Label>
                  <Input
                    type="text"

                    onChange={(e) => { }
                    }
                  />
                </div>




                <div>
                  <Label>Director Name</Label>
                  <Input
                    type="text"

                    onChange={(e) => { }
                    }
                  />
                </div>
                <div>
                  <Label>Director Phone</Label>
                  <Input
                    type="text"
                    onChange={(e) => { }
                    }
                  />

                  
                </div>


                <div>
                  <Label>12 Months</Label>
                  <Input
                    type="text"
                    value={percent}
                    onChange={(e) => {
                      setPercent(e.target.value)
                     }
                    }
                  />

                  
                </div>

                <div>
                  <Label>Percent Type</Label>
                  <Select
                    options={percent_type_options}
                    className="dark:bg-dark-900"
                   defaultValue={percent_type}
                    onChange={(e) => {
                      setPercentType(e);
                     }}

                  />
                </div>










                {/* 
                <div>
                  <Label>Image</Label>
                  <FileInput
                    onChange={handleFileChange}
                    className="custom-class"
                  />
                </div> */}
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleAdding}>
                Saves
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
