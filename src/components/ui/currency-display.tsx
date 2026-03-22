import { SaudiRiyalIcon } from "@/components/icons/SaudiRiyalIcon";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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
 * Displays amounts with custom currency symbol (supports uploaded SVG or default Saudi Riyal)
 * 
 * @param amount - The amount to display
 * @param className - Additional CSS classes
 * @param iconSize - Size of the currency icon (default: 16)
 * @param showIcon - Show the currency icon (default: true)
 * @param showText - Show "ر.س" text fallback (default: false)
 * 
 * @example
 * <CurrencyDisplay amount={1234.56} />
 * Output: [Custom Icon or SAR Icon] 1,234.56
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
  const [customSymbol, setCustomSymbol] = useState<string>("");

  useEffect(() => {
    // Load custom currency symbol from localStorage
    const savedCompanyInfo = localStorage.getItem("companyInfo");
    if (savedCompanyInfo) {
      const companyInfo = JSON.parse(savedCompanyInfo);
      if (companyInfo.currencySymbolSvg) {
        setCustomSymbol(companyInfo.currencySymbolSvg);
      }
    }
  }, []);

  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {showIcon && (
        customSymbol ? (
          <img 
            src={customSymbol} 
            alt="Currency" 
            className="flex-shrink-0"
            style={{ width: iconSize, height: iconSize }}
          />
        ) : (
          <SaudiRiyalIcon size={iconSize} className="flex-shrink-0" />
        )
      )}
      {showText && !showIcon && <span>ر.س</span>}
      <span>{formatted}</span>
    </span>
  );
}