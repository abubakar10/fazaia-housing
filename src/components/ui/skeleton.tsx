import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "overflow-hidden rounded-md bg-[linear-gradient(90deg,#e4f3fa_0%,#c8ebf8_45%,#e4f3fa_100%)] bg-[length:200%_100%] animate-shimmer",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
