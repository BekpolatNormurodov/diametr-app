import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import Moment from "moment";

interface Props {
  orders?: any[];
  isLoading?: boolean;
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString();
}

export default function MonthlyTarget({ orders = [], isLoading = false }: Props) {
  const now = Moment();
  const thisMonth = orders.filter((o) => {
    const d = Moment(o.createdt ?? o.createdAt);
    return d.isValid() && d.isSame(now, "month");
  });

  const total     = thisMonth.length;
  const finished  = thisMonth.filter((o) => o.status === "FINISHED").length;
  const canceled  = thisMonth.filter((o) => o.status === "CANCELED").length;
  const active    = thisMonth.filter((o) => o.status === "STARTED" || o.status === "CONFIRMED").length;
  const pct       = total > 0 ? Math.round((finished / total) * 100) : 0;
  const revenue   = thisMonth.filter((o) => o.status === "FINISHED").reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: { fontFamily: "Outfit, sans-serif", type: "radialBar", height: 240, sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: "72%" },
        track: { background: "#E4E7EC", strokeWidth: "100%", margin: 4 },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "32px", fontWeight: "700", offsetY: -28, color: "#1D2939",
            formatter: (val) => val + "%",
          },
        },
      },
    },
    fill: { type: "solid", colors: ["#465FFF"] },
    stroke: { lineCap: "round" },
    labels: ["Yakunlangan"],
  };

  const skeleton = "animate-pulse rounded-lg h-5 bg-gray-200 dark:bg-gray-700";

  const stat = (label: string, value: string | number, color: string) => (
    <div className="text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white">Bu oy buyurtmalari</h3>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{now.format("MMMM YYYY")}</p>
      </div>

      {/* Radial chart */}
      <div className="relative flex justify-center" style={{ height: 200 }}>
        {isLoading ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </div>
        ) : (
          <Chart options={options} series={[pct]} type="radialBar" height={200} />
        )}
      </div>

      {/* Center label inside chart */}
      <p className="text-center -mt-4 mb-2 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
        Yakunlangan
      </p>

      {/* Stats row */}
      <div className="grid grid-cols-4 border-t border-gray-100 dark:border-white/[0.06] divide-x divide-gray-100 dark:divide-white/[0.06]">
        <div className="px-3 py-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Jami</p>
          {isLoading ? <div className={skeleton + " mx-auto w-10"} /> : <p className="text-sm font-bold text-gray-800 dark:text-white">{total}</p>}
        </div>
        <div className="px-3 py-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Faol</p>
          {isLoading ? <div className={skeleton + " mx-auto w-10"} /> : <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{active}</p>}
        </div>
        <div className="px-3 py-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bekor</p>
          {isLoading ? <div className={skeleton + " mx-auto w-10"} /> : <p className="text-sm font-bold text-red-500 dark:text-red-400">{canceled}</p>}
        </div>
        <div className="px-3 py-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Daromad</p>
          {isLoading ? <div className={skeleton + " mx-auto w-14"} /> : <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmt(revenue)}</p>}
        </div>
      </div>
    </div>
  );
}