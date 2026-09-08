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
import MerchantsTable from "../../components/tables/new/merchants";
import FileInput from "../../components/form/input/FileInput";
import axiosClient from "../../service/axios.service";
import { useFetchWithLoader } from "../../hooks/useFetchWithLoader";
import { LoadSpinner } from "../../components/spinner/load-spinner";
export interface Merchant {
  name?: string;
  image?: string;
}
export default function MerchantsPage() {
  const { isOpen, openModal, closeModal } = useModal();
  const handleAdding = () => {
    // Handle save logic here

    console.log("handleAdding...");

    closeModal();
    setMerchant(emptyMerchant);
  };
  let emptyMerchant: Merchant = {
    name: "",
    image: "",
  };
  let [Merchant, setMerchant] = useState<Merchant>(emptyMerchant);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
    }
  };
  const fetchMerchants = useCallback(() => {
    return axiosClient.get("/merchant/all").then((res) => res.data);
  }, []);

  const { data, isLoading, error, refetch } = useFetchWithLoader({
    fetcher: fetchMerchants,
  });
  return (
    <>
      <PageMeta
        title="Shops | Diametr Dashboard"
        description="Diametr Dashboard"
      />
      <PageBreadcrumb pageTitle="Shops" />

      <div className="space-y-6 ">
        {isLoading && (
          <div className="min-h-[450px]  flex-col flex justify-center">
            <LoadSpinner />
          </div>
        )}

        {data && (
          <ComponentCard
            title="Merchants Table"
            action={
              <>
                <Button
                  size="sm"
                  variant="primary"
                  startIcon={<PlusIcon className="size-5 fill-white" />}
                  onClick={() => {
                    setMerchant(emptyMerchant);
                    openModal();
                  }}
                >
                  Add Merchant
                </Button>
              </>
            }
          >
            <MerchantsTable data={data} refetch={refetch} />
          </ComponentCard>
        )}
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Add Merchant
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Create new Merchant with full details.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input
                    type="text"
                    value={Merchant.name}
                    onChange={(e) =>
                      setMerchant({
                        ...Merchant,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Image</Label>
                  <FileInput
                    onChange={handleFileChange}
                    className="custom-class"
                  />
                </div>
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
