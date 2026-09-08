import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import Moment from "moment";

import Badge from "../../ui/badge/Badge";
import Button from "../../ui/button/Button";
import {
  ArrowRightIcon,
  CloseIcon,
  CloseLineIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  EyeCloseIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
} from "../../../icons";
import { useEffect, useState } from "react";
import { useModal } from "../../../hooks/useModal";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import { Modal } from "../../ui/modal";
import Select from "../../form/Select";
import { Fillial } from "../../../pages/new/Fillials";
import DropzoneComponent from "../../form/form-elements/DropZone";
import FileInputExample from "../../form/form-elements/FileInputExample";
import FileInput from "../../form/input/FileInput";


export interface FillialItemProps {
  id: number;
  name: string;
  image: string;
  createdAt: string;
  inn? :string;
  region:string;
   director_name : string;
    director_phone :string;
    percent_type : string;
  merchant?: {
    id: number;
    name: string;
    image: string;
    createdAt: string;
  };
}

// Define the table data using the interface
// const statictableData: Order[] = [
//   {
//     id: 1,
//     merchant: {
//       name: "Idea"
//     },
//     name: "Oq Tepa",
//     image: "/images/new/idea.png",
//     createdAt: new Date("2025-03-02"),
//     region: "Toshkent sh",
//     status: "Active",
//   },
//   {
//     id: 2,

//     name: "Mirobod",
//     merchant: {
//       name: "Idea"
//     },
//     region: "Toshkent sh",
//     image: "/images/new/idea.png",
//     createdAt: new Date("2025-03-02"),

//     status: "Active",
//   },

//   {
//     id: 3,
//     merchant: {
//       name: "MediaPark"
//     },
//     region: "Toshkent sh",
//     name: "Chilonzor",
//     image: "/images/new/media.png",
//     createdAt: new Date("2025-03-02"),
//     status: "Active",
//   },

//   {
//     id: 4,
//     merchant: {
//       name: "MediaPark"
//     },
//     region: "Samarqand",
//     name: "Shahrisabs",
//     image: "/images/new/media.png",
//     createdAt: new Date("2025-03-02"),
//     status: "Active",
//   },

// ];

export default function FillialsTable({
  data,
  refetch,
}: {
  data: FillialItemProps[];
  refetch: () => Promise<void>;
}) {
  const [tableData, settableData] = useState(data);

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
  let [Fillial, setFillial] = useState<Fillial>(emptyFillial);

  const options = [
    { value: "5", label: "5" },
    { value: "10", label: "10" },
    { value: "20", label: "20" },
  ];
  let [optionValue, setoptionValue] = useState("5");

  let [percent, setPercent] = useState("38");

  let [percent_type, setPercentType] = useState("OUT");

  const handleSelectChange = (value: string) => {
    setoptionValue(value);
  };

  // Pationation

  const [currentPage, setCurrentPage] = useState(1);
  const maxPage = Math.ceil(tableData.length / +optionValue);

  const startIndex = (currentPage - 1) * +optionValue;
  const endIndex = startIndex + +optionValue;
  let currentItems: FillialItemProps[] = tableData.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, maxPage));
  };
  console.log(">> data length :", tableData.length);

  useEffect(() => {
    const startIndex = (currentPage - 1) * +optionValue;
    const endIndex = startIndex + +optionValue;
    currentItems = tableData.slice(startIndex, endIndex);
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [optionValue]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
    }
  };

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

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="px-5 py-3  flex flex-row justify-between items-center border-b border-gray-100 dark:border-white/[0.05]">
          <div className="flex flex-row items-center gap-2 text-theme-sm font-medium text-gray-500 text-start  dark:text-gray-400">
            <span>Show</span>

            <Select
              options={options}
              onChange={handleSelectChange}
              className="dark:bg-dark-900"
              defaultValue="5"
            />
            <span>entries</span>
          </div>
          <div>
            {" "}
            <Button
              size="sm"
              variant="outline"
              endIcon={<DownloadIcon className="size-5 fill-white" />}
            >
              Download
            </Button>
          </div>
        </div>
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
                 <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                ID
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Fillial
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Merchant
              </TableCell>

               <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Director
              </TableCell>
               <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Region
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                INN
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {currentItems.map((order, index) => (
              <TableRow key={index}>
                 <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                  {order.id}
                </TableCell>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-sm ">
                      <img
                        width={50}
                        height={50}
                        src={order.image ? import.meta.env.VITE_STATIC_PATH +  order.image : "/images/shop.png"}
                        alt={order.name}
                      />
                    </div>
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {order.name}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {order.merchant?.name}
                </TableCell>

                 <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {order?.director_name}
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        {order?.director_phone}
                      </span>
                    </div>
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {order.region}
                </TableCell>

                   <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {order.inn}
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={
                      "success"
                      // order.status === "Active"
                      //   ? "success"
                      //   : order.status === "Pending"
                      //   ? "warning"
                      //   : "error"
                    }
                  >
                    Active
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 flex gap-2  flex-row items-center">
                  <Button
                    size="mini"
                    variant="outline"
                    className="text-xl fill-gray-500 dark:fill-gray-400"
                    onClick={() => {
                      setFillial({
                        name: order.name,
                        image: "",
                      });
                      openModal();
                    }}
                  >
                    <PencilIcon></PencilIcon>
                  </Button>

                  <Button
                    size="mini"
                    variant="outline"
                    onClick={async () => {}}
                  >
                    <DeleteIcon className="text-xl fill-gray-500 dark:fill-gray-400"></DeleteIcon>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="px-5 py-3 gap-3 flex flex-col md:flex-row justify-between md:items-center border-t border-gray-100 dark:border-white/[0.05] text-theme-sm font-medium text-gray-500  dark:text-gray-400">
        <div className="flex flex-row items-center gap-2  text-start  ">
          <Button
            size="sm"
            variant="outline"
            className="w-10 h-10"
            disabled={currentPage === 1}
            onClick={goToPreviousPage}
          >
            <ArrowRightIcon className="rotate-180 fill-gray-500  dark:fill-gray-400 scale-200" />
          </Button>

          {[...Array(maxPage)].map((_, i) => (
            <Button
              size="sm"
              variant={currentPage === i + 1 ? "primary" : "outline"}
              className="w-10 h-10"
              disabled={false}
              key={i}
              onClick={() => {
                currentPage !== i + 1 && setCurrentPage(i + 1);
              }}
            >
              {i + 1}
            </Button>
          ))}

          <Button
            size="sm"
            variant="outline"
            className="w-10 h-10"
            disabled={currentPage === maxPage}
            onClick={goToNextPage}
          >
            <ArrowRightIcon className=" fill-gray-500  dark:fill-gray-400 scale-200" />
          </Button>
        </div>
        <div>
          Showing {(currentPage - 1) * +optionValue + 1} to{" "}
          {Math.min(data.length, currentPage * +optionValue)} of{" "}
          {data.length} entries
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Fillial
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update Fillial with full details.
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
                    onChange={() => {}}
                  />
                </div>

                <div>
                  <Label>Address</Label>
                  <Input type="text" />
                </div>

                <div>
                  <Label>Merchant</Label>
                  <Select
                    options={all_merchant_options}
                    className="dark:bg-dark-900"
                    onChange={() => {}}
                  />
                </div>

                <div>
                  <Label>Name</Label>
                  <Input
                    type="text"
                    value={Fillial.name}
                    onChange={(e) =>
                      setFillial({
                        ...Fillial,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Bank name</Label>
                  <Input type="text" onChange={(e) => {}} />
                </div>

                <div>
                  <Label>MFO</Label>
                  <Input type="text" onChange={(e) => {}} />
                </div>
                <div>
                  <Label>INN</Label>
                  <Input type="text" onChange={(e) => {}} />
                </div>

                <div>
                  <Label>Hisob raqam</Label>
                  <Input type="text" onChange={(e) => {}} />
                </div>

                <div>
                  <Label>Director Name</Label>
                  <Input type="text" onChange={(e) => {}} />
                </div>
                <div>
                  <Label>Director Phone</Label>
                  <Input type="text" onChange={(e) => {}} />
                </div>

                <div>
                  <Label>12 Months</Label>
                  <Input
                    type="text"
                    value={percent}
                    onChange={(e) => {
                      setPercent(e.target.value);
                    }}
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
    </div>
  );
}
