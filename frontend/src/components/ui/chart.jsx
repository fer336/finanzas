import * as React from "react"
import { cn } from "../../lib/utils"

const ChartContainer = React.forwardRef(({ className, config, children, ...props }, ref) => {
  const style = {
    "--color-ingresos": config?.ingresos?.color || "hsl(141.9, 69.2%, 58%)",
    "--color-gastos": config?.gastos?.color || "hsl(0, 84.2%, 60.2%)",
    "--color-objetivos": config?.objetivos?.color || "hsl(27, 96%, 61%)",
    "--color-pagosPendientes": config?.pagosPendientes?.color || "hsl(187.9, 85.7%, 53.3%)"
  }
  
  return (
    <div ref={ref} className={cn("w-full", className)} style={style} {...props}>
      {children}
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = ({ content, ...props }) => {
  if (content) {
    return React.cloneElement(content, props)
  }
  return null
}

const ChartTooltipContent = React.forwardRef(({ 
  active, 
  payload, 
  label, 
  labelFormatter, 
  formatter,
  indicator = "dot",
  className,
  ...props 
}, ref) => {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-background p-2 shadow-md",
        className
      )}
      {...props}
    >
      {label && (
        <div className="mb-2 font-medium">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {indicator === "dot" && (
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
            )}
            <span className="font-medium">
              {formatter ? formatter(entry.value, entry.dataKey)[1] : entry.dataKey}:
            </span>
            <span>
              {formatter ? formatter(entry.value, entry.dataKey)[0] : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltip, ChartTooltipContent }