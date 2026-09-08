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
  DollarLineIcon,
  DownloadIcon,
  EditIcon,
  EyeCloseIcon,
  EyeIcon,
  FileIcon,
  GroupIcon,
  PlusIcon,
  ShootingStarIcon,
  TimeIcon,
  UserCircleIcon,
  UserIcon,
} from "../../../icons";
import { useEffect, useState } from "react";
import { useModal } from "../../../hooks/useModal";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import { Modal } from "../../ui/modal";
import Select from "../../form/Select";
import FileInput from "../../form/input/FileInput";
import { App } from "../../../pages/new/Apps";
import { formatMoney } from "../../../service/formatters/money.format";
import { formatPhoneNumber } from "../../../service/formatters/phone.format";

// interface Order {
//   id: number;
//   user: {
//     image: string;
//     name: string;
//     phone: string;
//     password: string;
//   };
//   fillial :{
//    name : string;
//   },
//   createdAt: Date;
//   team: {
//     images: string[];
//   };
//   status: string;
//   showPassword: boolean;
// }

interface AppItemProps {
  id: number;
  fullname: string;
  image: string;
  phone: string;
  phone2: string;
  amount?: number;
  status?: string;
  passport?: string;
  payment_amount?: number;
  limit?: number;
  loanid?: string;
  expired_month?: string;
  bank?: {
    id?: number;
    name?: string;
  };
  products?: {
    name?: string;
    price?: number;
    count?: number;
    hash?: string;
  }[];

  createdAt: string;
  fillial?: {
    id: number;
    name: string;
    image: string;
    region: string;
    inn?: string;
    director_name: string;
    director_phone: string;
    percent_type: string;
    createdAt: string;
  };
  merchant?: {
    id: number;
    name: string;
    image: string;
    createdAt: string;
  };
}

export default function AppsTable({
  data,
  refetch,
  merchants,
  fillials,
}: {
  data: AppItemProps[];
  refetch: () => Promise<void>;
  merchants: any[];
  fillials: any[];
}) {
  const [tableData, settableData] = useState(data);

  const { isOpen, openModal, closeModal } = useModal();
  const handleAdding = () => {
    // Handle save logic here

    console.log("handleAdding...");

    closeModal();
    setApp(emptyApp);
  };
  let emptyApp: App = {
    fullname: "",
    phone: "901234567",
  };
  let [App, setApp] = useState<App>(emptyApp);

  const options = [
    { value: "5", label: "5" },
    { value: "10", label: "10" },
    { value: "20", label: "20" },
  ];
  let [optionValue, setoptionValue] = useState("5");

  let [regionValue, setregionValue] = useState("ALL REGIONS");
  let [statusValue, setstatusValue] = useState("ALL STATUSES");
  let [monthValue, setmonthValue] = useState("ALL MONTHS");
  let [merchantValue, setmerchantValue] = useState("ALL MERCHANTS");
  let [fillialValue, setfillialValue] = useState("ALL FILLIALS");
  const handleSelectChange = (value: string) => {
    setoptionValue(value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
    }
  };

  // Pationation

  const [currentPage, setCurrentPage] = useState(1);
  const maxPage = Math.ceil(tableData.length / +optionValue);

  const startIndex = (currentPage - 1) * +optionValue;
  const endIndex = startIndex + +optionValue;
  let currentItems: AppItemProps[] = tableData.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, maxPage));
  };
  console.log(">> data length :", data.length);

  useEffect(() => {
    const startIndex = (currentPage - 1) * +optionValue;
    const endIndex = startIndex + +optionValue;
    currentItems = tableData.slice(startIndex, endIndex);
  }, [currentPage]);

  useEffect(() => {
    setfillialValue("ALL FILLIALS");
  }, [merchantValue]);

  useEffect(() => {
    setCurrentPage(1);
    let sorted_data: AppItemProps[];
    if (regionValue == "ALL REGIONS") {
      sorted_data = [...data];
    } else {
      sorted_data = [
        ...data.filter((item) => item.fillial?.region == regionValue),
      ];
    }

    if (statusValue != "ALL STATUSES") {
      sorted_data = sorted_data.filter((item) => item.status == statusValue);
    }

    if (monthValue != "ALL MONTHS") {
      sorted_data = sorted_data.filter(
        (item) => item.expired_month == monthValue && item.payment_amount
      );
    }
    if (merchantValue != "ALL MERCHANTS") {
      sorted_data = sorted_data.filter(
        (item) => item.merchant?.id.toString() == merchantValue
      );
    }

    if (fillialValue != "ALL FILLIALS") {
      sorted_data = sorted_data.filter(
        (item) => item.fillial?.id.toString() == fillialValue
      );
    }
    settableData(sorted_data);
  }, [
    optionValue,
    regionValue,
    statusValue,
    monthValue,
    merchantValue,
    fillialValue,
  ]);

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

  const all_status_option = [
    { value: "ALL STATUSES", label: "ALL STATUSES" },
    { value: "CREATED", label: "CREATED" },
    { value: "ADDED_DETAIL", label: "ADDED_DETAIL" },
    { value: "WAITING_SCORING", label: "WAITING_SCORING" },
    { value: "LIMIT", label: "LIMIT" },
    { value: "CANCELED_BY_SCORING", label: "CANCELED_BY_SCORING" },
    { value: "CANCELED_BY_CLIENT", label: "CANCELED_BY_CLIENT" },
    { value: "CANCELED_BY_DAILY", label: "CANCELED_BY_DAILY" },
    { value: "ADDED_PRODUCT", label: "ADDED_PRODUCT" },
    { value: "WAITING_BANK_UPDATE", label: "WAITING_BANK_UPDATE" },
    { value: "WAITING_BANK_CONFIRM", label: "WAITING_BANK_CONFIRM" },
    { value: "CONFIRMED", label: "CONFIRMED" },
    { value: "FINISHED", label: "FINISHED" },
  ];

  const all_fillial_options = [
    { value: "Artel", label: "Artel" },
    { value: "Idea", label: "Idea" },
    { value: "MediaPark", label: "MediaPark" },
  ];

  const all_month_options = [
    { value: "ALL MONTHS", label: "ALL MONTHS" },
    { value: "1", label: "1" },
    { value: "3", label: "3" },
    { value: "6", label: "6" },
    { value: "9", label: "9" },
    { value: "10", label: "10" },
    { value: "12", label: "12" },
    { value: "18", label: "18" },
    { value: "24", label: "24" },
  ];

  let totalAmount = () => {
    let amount = 0;
    tableData
      .filter((item) => ["FINISHED", "CONFIRMED"].includes(item.status ?? ""))
      .forEach((e) => {
        amount += e.payment_amount ?? 0;
      });
    return amount;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="px-5 py-3  flex flex-row justify-between items-center ">
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
            options={all_region_option}
            onChange={(e) => setregionValue(e)}
            className="dark:bg-dark-900"
          />
          <Select
            options={all_status_option}
            onChange={(e) => setstatusValue(e)}
            className="dark:bg-dark-900"
          />
          <Select
            options={all_month_options}
            onChange={(e) => setmonthValue(e)}
            className="dark:bg-dark-900"
          />

          <Select
            options={all_merchant_options}
            onChange={(e) => setmerchantValue(e)}
            className="dark:bg-dark-900"
          />

          <Select
            options={[
              { value: "ALL FILLIALS", label: "ALL FILLIALS" },
              ...fillials.filter((item) => {
                if (merchantValue == "ALL MERCHANTS") {
                  return true;
                } else {
                  return item.value == merchantValue;
                }
              }),
            ]}
            onChange={(e) => setfillialValue(e)}
            className="dark:bg-dark-900"
          />
        </div>

        <div className="px-5 py-3  flex flex-row items-start flex-wrap gap-4 border-b border-gray-100 dark:border-white/[0.05]">
          {/* <span className="flex fex-row items-center gap-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">
            <FileIcon className="size-5 fill-white" /> ALL STATISTICS
          </span> */}

          <span className="flex fex-row items-center gap-2  text-gray-500 text-theme-xs dark:text-gray-400">
           <ShootingStarIcon className="size-5 fill-white" /> TOTAL AMOUNT : {formatMoney(totalAmount())} UZS
          </span>

          <span className="flex fex-row items-center gap-2  text-gray-500 text-theme-xs dark:text-gray-400">
           <GroupIcon className="size-5 fill-white" /> ALL : {formatMoney(tableData.length)}
          </span>
          <span className="flex fex-row items-center gap-2  text-gray-500 text-theme-xs dark:text-gray-400">
          <CheckLineIcon className="size-5 " />  FINISHED :{" "}
            {formatMoney(
              tableData.filter((item) =>
                ["FINISHED", "CONFIRMED"].includes(item.status ?? "")
              ).length
            )}
          </span>

          <span className="flex fex-row items-center gap-2  text-gray-500 text-theme-xs dark:text-gray-400">
           <CloseLineIcon className="size-5 fill-white" />  CANCELED :{" "}
            {formatMoney(
              tableData.filter((item) =>
                [
                  "CANCELED_BY_SCORING",
                  "CANCELED_BY_CLIENT",
                  "CANCELED_BY_DAILY",
                ].includes(item.status ?? "")
              ).length
            )}
          </span>

          <span className="flex fex-row items-center gap-2  text-gray-500 text-theme-xs dark:text-gray-400">
           <UserIcon className="size-5 fill-white" />  LIMIT :{" "}
            {formatMoney(
              tableData.filter((item) => ["LIMIT"].includes(item.status ?? ""))
                .length
            )}
          </span>

          <span className="flex fex-row items-center gap-2  text-gray-500 text-theme-xs dark:text-gray-400">
          <TimeIcon className="size-5 fill-white" />   WAITING :{" "}
            {formatMoney(
              tableData.filter((item) =>
                [
                  "CREATED",
                  "ADDED_DETAIL",
                  "ADDED_PRODUCT",
                  "WAITING_BANK_UPDATE",
                  "WAITING_BANK_CONFIRM",
                ].includes(item.status ?? "")
              ).length
            )}
          </span>
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
                Client
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
                Limit
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Amount
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Month
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
                Bank
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Created
              </TableCell>
              {/* <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Actions
              </TableCell> */}
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
                    {/* <div className="w-10 h-10 overflow-hidden rounded-full">
                      <img
                        width={40}
                        height={40}
                        src={
                          order.image
                            ? import.meta.env.VITE_STATIC_PATH + order.image
                            : "/images/user.png"
                        }
                        alt={order.fullname}
                      />
                    </div> */}
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {order.fullname}
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        {order.passport}{" "}
                        {order.phone || order.phone2
                          ? ", " +
                            formatPhoneNumber(order.phone ?? order.phone2)
                          : ""}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {order.fillial?.name}
                  <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                    {order.fillial?.region}
                  </span>
                </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {order.merchant?.name}
                  
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {formatMoney(order.limit)}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {formatMoney(order.payment_amount)}
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                  {order.payment_amount && order.expired_month}
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={
                      order.status
                        ? ["CONFIRMED", "FINISHED"].includes(order.status)
                          ? "primary"
                          : [
                              "CANCELED_BY_SCORING",
                              "CANCELED_BY_CLIENT",
                              "CANCELED_BY_DAILY",
                            ].includes(order.status)
                          ? "error"
                          : ["LIMIT"].includes(order.status)
                          ? "success"
                          : "warning"
                        : "light"
                    }
                  >
                    {order.status}
                  </Badge>
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {order.bank?.name}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {Moment(order.createdAt).format("HH:mm - MMMM DD, yyyy")}
                </TableCell>
                {/* <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 flex gap-2  flex-row items-center">
                  <Button
                    size="mini"
                    variant="outline"
                    className="text-xl fill-gray-500 dark:fill-gray-400"
                    onClick={() => {
                      setApp({
                        fullname: order.fullname,
                        phone: order.phone,
                      });
                      openModal();
                    }}
                  >
                    <EditIcon></EditIcon>
                  </Button>

                  <Button
                    size="mini"
                    variant="outline"
                    onClick={async () => {}}
                  >
                    <DeleteIcon className="text-xl fill-gray-500 dark:fill-gray-400"></DeleteIcon>
                  </Button>
                </TableCell> */}
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
          {Math.min(tableData.length, currentPage * +optionValue)} of{" "}
          {tableData.length} entries
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit App
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update App with full details.
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
                  <Label>Fullname</Label>
                  <Input
                    type="text"
                    value={App.fullname}
                    onChange={(e) =>
                      setApp({
                        ...App,
                        fullname: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Phonenumber</Label>
                  <Input
                    type="text"
                    value={App.phone}
                    onChange={(e) =>
                      setApp({
                        ...App,
                        phone: e.target.value,
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
    </div>
  );
}
