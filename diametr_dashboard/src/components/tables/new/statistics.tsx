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
  CheckLineIcon,
  CloseIcon,
  CloseLineIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  EyeCloseIcon,
  EyeIcon,
  GroupIcon,
  PlusIcon,
  ShootingStarIcon,
} from "../../../icons";
import { useEffect, useState } from "react";
import { useModal } from "../../../hooks/useModal";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import { Modal } from "../../ui/modal";
import Select from "../../form/Select";
import { Statistic } from "../../../pages/new/Statistics";
import DropzoneComponent from "../../form/form-elements/DropZone";
import FileInputExample from "../../form/form-elements/FileInputExample";
import FileInput from "../../form/input/FileInput";
import { formatMoney } from "../../../service/formatters/money.format";

export interface StatisticItemProps {
  id: number;
  name: string;
  image: string;
  createdAt: string;
  inn?: string;
  region: string;
  director_name: string;
  director_phone: string;
  percent_type: string;
  periods?: {
    all: {
      statuses?: any;
      total_count?: number;
      total_amount?: number;
    };
    this_year: {
      statuses?: any;
      total_count?: number;
      total_amount?: number;
    };
    last_month: {
      statuses?: any;
      total_count?: number;
      total_amount?: number;
    };
    this_month: {
      statuses?: any;
      total_count?: number;
      total_amount?: number;
    };
  };
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

export default function StatisticsTable({
  data,
   refetch,
   merchants,
}: {
  data: StatisticItemProps[];
  refetch: () => Promise<void>;
   merchants : any[]
}) {
  const [tableData, settableData] = useState(data);

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
  let [Statistic, setStatistic] = useState<Statistic>(emptyStatistic);

  const options = [
    { value: "5", label: "5" },
    { value: "10", label: "10" },
    { value: "20", label: "20" },
  ];
  let [optionValue, setoptionValue] = useState("5");


  let [merchantValue, setmerchantValue] = useState("ALL MERCHANTS");
    const all_merchant_options = [
    { value: "ALL MERCHANTS", label: "ALL MERCHANTS" },
    ...merchants,
  ];

  const all_region_option = [
    { value: "ALL REGIONS", label: "ALL REGIONS" },
    { value: "TOSHKENT_SHAHAR", label: "TOSHKENT_SHAHAR" },
    { value: "ANDIJON", label: "ANDIJON" },
    { value: "BUXORO", label: "BUXORO" },
    { value: "FARGONA", label: "FARGONA" },
    { value: "JIZZAX", label: "JIZZAX" },
    { value: "XORAZM", label: "XORAZM" },
    { value: "NAMANGAN", label: "NAMANGAN" },
    { value: "NAVOIY", label: "NAVOIY" },
    { value: "QASHQADARYO", label: "QASHQADARYO" },
    { value: "QORAQALPOQ", label: "QORAQALPOQ" },
    { value: "SAMARQAND", label: "SAMARQAND" },
    { value: "SIRDARYO", label: "SIRDARYO" },
    { value: "SURXONDARYO", label: "SURXONDARYO" },
    { value: "TOSHKENT", label: "TOSHKENT" },
  ];
    let [regionValue, setregionValue] = useState("ALL REGIONS");

  const handleSelectChange = (value: string) => {
    setoptionValue(value);
  };

  // Pationation

  const [currentPage, setCurrentPage] = useState(1);
  const maxPage = Math.ceil(tableData.length / +optionValue);

  const startIndex = (currentPage - 1) * +optionValue;
  const endIndex = startIndex + +optionValue;
  let currentItems: StatisticItemProps[] = tableData.slice(
    startIndex,
    endIndex
  );

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
    let sorted_data: StatisticItemProps[];
    if (regionValue == "ALL REGIONS") {
      sorted_data = [...data];
    } else {
      sorted_data = [
        ...data.filter((item) => item.region == regionValue),
      ];
    }

  
    
    if (merchantValue != "ALL MERCHANTS") {
      sorted_data = sorted_data.filter(
        (item) => item.merchant?.id.toString() == merchantValue
      );
    }

    
    settableData(sorted_data);
  }, [optionValue,regionValue,merchantValue]);

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

        <div className="px-5 py-3  flex flex-row flex-wrap gap-2 items-center  border-b border-gray-100 dark:border-white/[0.05]">
              <Select
            options={all_merchant_options}
            onChange={(e) => setmerchantValue(e)}
            className="dark:bg-dark-900"
          />

           <Select
            options={all_region_option}
            onChange={(e) => setregionValue(e)}
            className="dark:bg-dark-900"
          />
        </div>
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Statistic
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Arizalar (Umumiy)
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Joriy oy (
                {
                  [
                    "Yanvar",
                    "Fevral",
                    "Mart",
                    "Aprel",
                    "May",
                    "Iyun",
                    "Iyul",
                    "Avgust",
                    "Sentabr",
                    "Oktabr",
                    "Noyabr",
                    "Dekabr",
                  ][new Date().getMonth()]
                }
                )
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                O'tgan oy (
                {
                  [
                    "Yanvar",
                    "Fevral",
                    "Mart",
                    "Aprel",
                    "May",
                    "Iyun",
                    "Iyul",
                    "Avgust",
                    "Sentabr",
                    "Oktabr",
                    "Noyabr",
                    "Dekabr",
                  ][new Date().getMonth() - 1]
                }
                )
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Joriy yil ({new Date().getFullYear()})
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
                Region
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {currentItems.map((order, index) => (
              <TableRow key={index}>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-sm ">
                      <img
                        width={50}
                        height={50}
                        src={
                          order.image
                            ? import.meta.env.VITE_STATIC_PATH + order.image
                            : "/images/shop.png"
                        }
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
                  <span className="flex flex-row gap-2 items-center font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    <GroupIcon className="size-5 fill-white" />{" "}
                    {formatMoney(order.periods?.all?.total_count)}
                    <CheckLineIcon className="size-5 ml-2" />{" "}
                    {formatMoney(
                      (order.periods?.all?.statuses?.FINISHED?.total_count ??
                        0) +
                        (order.periods?.all?.statuses?.CONFIRMED?.total_count ??
                          0)
                    )}
                    <CloseIcon className="size-5 ml-2" />{" "}
                    {formatMoney(
                      (order.periods?.all?.statuses?.CANCELED_BY_SCORING
                        ?.total_count ?? 0) +
                        (order.periods?.all?.statuses?.CANCELED_BY_CLIENT
                          ?.total_count ?? 0) +
                        (order.periods?.all?.statuses?.CANCELED_BY_DAILY
                          ?.total_count ?? 0)
                    )}
                  </span>
                  <span className="flex flex-row gap-2 items-center text-gray-500 text-theme-xs dark:text-gray-400">
                    <ShootingStarIcon className="size-5 fill-white" />{" "}
                    {formatMoney(order.periods?.all?.total_amount)} UZS
                  </span>
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <span className="flex flex-row gap-2 items-center font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    <GroupIcon className="size-5 fill-white" />{" "}
                    {formatMoney(order.periods?.this_month?.total_count)}
                    <CheckLineIcon className="size-5 ml-2" />{" "}
                    {formatMoney(
                      (order.periods?.this_month?.statuses?.FINISHED
                        ?.total_count ?? 0) +
                        (order.periods?.this_month?.statuses?.CONFIRMED
                          ?.total_count ?? 0)
                    )}
                    <CloseIcon className="size-5 ml-2" />{" "}
                    {formatMoney(
                      (order.periods?.this_month?.statuses?.CANCELED_BY_SCORING
                        ?.total_count ?? 0) +
                        (order.periods?.this_month?.statuses?.CANCELED_BY_CLIENT
                          ?.total_count ?? 0) +
                        (order.periods?.this_month?.statuses?.CANCELED_BY_DAILY
                          ?.total_count ?? 0)
                    )}
                  </span>
                  <span className="flex flex-row gap-2 items-center text-gray-500 text-theme-xs dark:text-gray-400">
                    <ShootingStarIcon className="size-5 fill-white" />{" "}
                    {formatMoney(order.periods?.this_month?.total_amount)} UZS
                  </span>
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <span className="flex flex-row gap-2 items-center font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    <GroupIcon className="size-5 fill-white" />{" "}
                    {formatMoney(order.periods?.last_month?.total_count)}
                    <CheckLineIcon className="size-5 ml-2" />{" "}
                    {formatMoney(
                      (order.periods?.last_month?.statuses?.FINISHED
                        ?.total_count ?? 0) +
                        (order.periods?.last_month?.statuses?.CONFIRMED
                          ?.total_count ?? 0)
                    )}
                    <CloseIcon className="size-5 ml-2" />{" "}
                    {formatMoney(
                      (order.periods?.last_month?.statuses?.CANCELED_BY_SCORING
                        ?.total_count ?? 0) +
                        (order.periods?.last_month?.statuses?.CANCELED_BY_CLIENT
                          ?.total_count ?? 0) +
                        (order.periods?.last_month?.statuses?.CANCELED_BY_DAILY
                          ?.total_count ?? 0)
                    )}
                  </span>
                  <span className="flex flex-row gap-2 items-center text-gray-500 text-theme-xs dark:text-gray-400">
                    <ShootingStarIcon className="size-5 fill-white" />{" "}
                    {formatMoney(order.periods?.last_month?.total_amount)} UZS
                  </span>
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <span className="flex flex-row gap-2 items-center font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    <GroupIcon className="size-5 fill-white" />{" "}
                    {formatMoney(order.periods?.this_year?.total_count)}
                    <CheckLineIcon className="size-5 ml-2" />{" "}
                    {formatMoney(
                      (order.periods?.this_year?.statuses?.FINISHED
                        ?.total_count ?? 0) +
                        (order.periods?.this_year?.statuses?.CONFIRMED
                          ?.total_count ?? 0)
                    )}
                    <CloseIcon className="size-5 ml-2" />{" "}
                    {formatMoney(
                      (order.periods?.this_year?.statuses?.CANCELED_BY_SCORING
                        ?.total_count ?? 0) +
                        (order.periods?.this_year?.statuses?.CANCELED_BY_CLIENT
                          ?.total_count ?? 0) +
                        (order.periods?.this_year?.statuses?.CANCELED_BY_DAILY
                          ?.total_count ?? 0)
                    )}
                  </span>

                  <span className="flex flex-row gap-2 items-center text-gray-500 text-theme-xs dark:text-gray-400">
                    <ShootingStarIcon className="size-5 fill-white" />{" "}
                    {formatMoney(order.periods?.this_year?.total_amount)} UZS
                  </span>
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {order.merchant?.name}
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {order.region}
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
          {Math.min(data.length, currentPage * +optionValue)} of {data.length}{" "}
          entries
        </div>
      </div>
    </div>
  );
}
