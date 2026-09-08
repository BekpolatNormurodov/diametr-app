import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import OperatorsTable from "../../components/tables/new/operators";
import { BoxIcon, PlusIcon } from "../../icons";
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
export interface Operator {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
}
export default function OperatorsPage() {
  const { isOpen, openModal, closeModal } = useModal();
  const handleAdding = () => {
    // Handle save logic here

    console.log("handleAdding...");

    closeModal();
    setOperator(emptyOperator);
  };
  let emptyOperator: Operator = {
    firstName: "",
    lastName: "",
    phone: "901234567",
    password: "12345678",
  };
  let [Operator, setOperator] = useState<Operator>(emptyOperator);
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

  const fetchOperators = useCallback(() => {
    return axiosClient.get("/user/all").then((res) => res.data);
  }, []);

  const { data, isLoading, error, refetch } = useFetchWithLoader({
    fetcher: fetchOperators,
  });

  return (
    <>
      <PageMeta
        title="Operators | Diametr Dashboard"
        description="Diametr Dashboard"
      />
      <PageBreadcrumb pageTitle="Operators" />

      <div className="space-y-6 ">
        {isLoading && (
          <div className="min-h-[450px]  flex-col flex justify-center">
            <LoadSpinner />
          </div>
        )}
        {data && (
          <ComponentCard
            title="Operators Table"
            action={
              <>
                <Button
                  size="sm"
                  variant="primary"
                  startIcon={<PlusIcon className="size-5 fill-white" />}
                  onClick={() => {
                    setOperator(emptyOperator);
                    openModal();
                  }}
                >
                  Add Operator
                </Button>
              </>
            }
          >
            <OperatorsTable data={data} refetch={refetch} />
          </ComponentCard>
        )}
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Add Operator
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Create new Operator with full details.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Merchant</Label>
                  <Select
                    options={all_merchant_options}
                    className="dark:bg-dark-900"
                    onChange={() => {}}
                  />
                </div>
                <div>
                  <Label>Fillial</Label>
                  <Select
                    options={all_fillial_options}
                    className="dark:bg-dark-900"
                    onChange={() => {}}
                  />
                </div>
                <div>
                  <Label>Firstname</Label>
                  <Input
                    type="text"
                    value={Operator.firstName}
                    onChange={(e) =>
                      setOperator({
                        ...Operator,
                        firstName: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Lastname</Label>
                  <Input
                    type="text"
                    value={Operator.lastName}
                    onChange={(e) =>
                      setOperator({
                        ...Operator,
                        lastName: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Phonenumber</Label>
                  <Input
                    type="text"
                    value={Operator.phone}
                    onChange={(e) =>
                      setOperator({
                        ...Operator,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Password</Label>
                  <Input
                    type="text"
                    value={Operator.password}
                    onChange={(e) =>
                      setOperator({
                        ...Operator,
                        password: e.target.value,
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
