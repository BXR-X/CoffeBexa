import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: Frontend UI.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-primary/10", className)} {...props} />;
}

export { Skeleton };
