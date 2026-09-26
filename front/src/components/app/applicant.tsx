import { Star } from "lucide-react";
import { Avatar } from "./avatar";

export function Applicant({
  name,
  initials,
  subject,
  rating,
  price,
  currency = "MAD/h",
}: {
  name: string;
  initials: string;
  subject: string;
  rating: number;
  price: number;
  currency?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar initials={initials} tone="neutral" size={32} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-[#0B0B0F]">{name}</p>
        <div className="mt-0.5 flex items-center gap-1 text-[10.5px] text-[#8A8D93]">
          <Star className="h-2.5 w-2.5 fill-[#0B0B0F] text-[#0B0B0F]" strokeWidth={0} />
          <span className="font-semibold text-[#0B0B0F]">{rating.toFixed(1)}</span>
          <span>·</span>
          <span className="truncate">{subject}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[11px] font-bold text-[#0B0B0F]">{price}</p>
        <p className="text-[9px] font-medium text-[#8A8D93]">{currency}</p>
      </div>
    </div>
  );
}
