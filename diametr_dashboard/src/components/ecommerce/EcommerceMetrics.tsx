import {
  ArrowUpIcon,
  BoxIconLine,
  DeliveryIcon,
  GroupIcon,
  MoneyIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

interface EcommerceMetricsProps {
  clientsCount?: number;
  productsCount?: number;
  ordersCount?: number;
  totalSales?: number;
  isLoading?: boolean;
  lastUpdated?: Date | null;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  return n.toLocaleString("uz-UZ");
}

function fmtTime(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function EcommerceMetrics({
  clientsCount = 0,
  productsCount = 0,
  ordersCount = 0,
  totalSales = 0,
  isLoading = false,
  lastUpdated = null,
}: EcommerceMetricsProps) {
  const skeleton =
    "animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-7 w-24";

  return (
    <div className="space-y-2">
      {lastUpdated && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-right pr-1">
          Oxirgi yangilanish: {fmtTime(lastUpdated)}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {/* Clients */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Clients</span>
              {isLoading ? (
                <div className={skeleton + " mt-2"} />
              ) : (
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {fmt(clientsCount)}
                </h4>
              )}
            </div>
            <Badge color="success"><ArrowUpIcon />Live</Badge>
          </div>
        </div>

        {/* Products */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Products</span>
              {isLoading ? (
                <div className={skeleton + " mt-2"} />
              ) : (
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {fmt(productsCount)}
                </h4>
              )}
            </div>
            <Badge color="success"><ArrowUpIcon />Live</Badge>
          </div>
        </div>

        {/* Orders */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <DeliveryIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Delivery</span>
              {isLoading ? (
                <div className={skeleton + " mt-2"} />
              ) : (
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {fmt(ordersCount)}
                </h4>
              )}
            </div>
            <Badge color="success"><ArrowUpIcon />Live</Badge>
          </div>
        </div>

        {/* Total Sales */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <MoneyIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">All Sales</span>
              {isLoading ? (
                <div className={skeleton + " mt-2"} />
              ) : (
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {fmt(totalSales)}
                </h4>
              )}
            </div>
            <Badge color="success"><ArrowUpIcon />Live</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
