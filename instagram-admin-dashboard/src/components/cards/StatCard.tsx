import { TrendingUp, TrendingDown } from "lucide-react";
import type { StatCardData } from "../../types";
import { cn } from "../../utils/cn";
import type { ReactElement } from "react";
import {
  Users,
  Images,
  Clapperboard,
  Activity,
} from "lucide-react";

const iconMap: Record<string, ReactElement> = {
  users: <Users className="h-5 w-5" />,
  image: <Images className="h-5 w-5" />,
  video: <Clapperboard className="h-5 w-5" />,
  activity: <Activity className="h-5 w-5" />,
};

type StatCardProps = {
  data: StatCardData;
};

export function StatCard({ data }: StatCardProps) {
  const Icon = iconMap[data.icon] ?? <Activity className="h-5 w-5" />;
  const isPositive = data.change >= 0;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{data.label}</p>
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-dark/10 text-primary-dark flex items-center justify-center">
          {Icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-semibold text-gray-900">{data.value}</p>
        <div className="flex items-center gap-1 mt-1 text-sm">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-rose-500" />
          )}
          <span
            className={cn(
              "font-medium",
              isPositive ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {isPositive ? "+" : ""}
            {data.change}%
          </span>
          <span className="text-gray-400">vs last week</span>
        </div>
      </div>
    </div>
  );
}

