import { SaudiRiyalIcon } from "@/components/icons/SaudiRiyalIcon";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  iconSize?: number;
  showIcon?: boolean;
  showText?: boolean;
}

/**
 * Currency Display Component
 * 
 * Displays amounts in Saudi Riyal with the custom SAR symbol icon
 * 
 * @param amount - The amount to display
 * @param className - Additional CSS classes
 * @param iconSize - Size of the SAR icon (default: 16)
 * @param showIcon - Show the Saudi Riyal icon (default: true)
 * @param showText - Show "ر.س" text fallback (default: false)
 * 
 * @example
 * <CurrencyDisplay amount={1234.56} />
 * Output: [SAR Icon] 1,234.56
 * 
 * @example
 * <CurrencyDisplay amount={1234.56} showText={true} showIcon={false} />
 * Output: ر.س 1,234.56
 */
export function CurrencyDisplay({ 
  amount, 
  className = "", 
  iconSize = 16,
  showIcon = true,
  showText = false
}: CurrencyDisplayProps) {
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {showIcon && <SaudiRiyalIcon size={iconSize} className="flex-shrink-0" />}
      {showText && !showIcon && <span>ر.س</span>}
      <span>{formatted}</span>
    </span>
  );
}