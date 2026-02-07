import * as React from "react"
import { cn } from "../../lib/utils"
import { Input } from "./input"

export function DateRangePicker({ className, date, onDateChange }) {
  const handleFromDateChange = (e) => {
    const fromDate = e.target.value ? new Date(e.target.value) : null;
    onDateChange({
      from: fromDate,
      to: date?.to || null
    });
  };

  const handleToDateChange = (e) => {
    const toDate = e.target.value ? new Date(e.target.value) : null;
    onDateChange({
      from: date?.from || null,
      to: toDate
    });
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-3", className)}>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Desde:</span>
        <Input
          type="date"
          value={formatDateForInput(date?.from)}
          onChange={handleFromDateChange}
          className="w-full sm:w-[140px]"
        />
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Hasta:</span>
        <Input
          type="date"
          value={formatDateForInput(date?.to)}
          onChange={handleToDateChange}
          className="w-full sm:w-[140px]"
        />
      </div>
    </div>
  )
}