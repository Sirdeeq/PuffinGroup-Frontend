import Image from "next/image"
import { cn } from "@/lib/utils"
import logo  from "../components/img/logo.png"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showText?: boolean
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
  xxl: "h-20 w-20",
  xxxl: "h-24 w-24",
  xxxxl: "h-28 w-28",
  xxxxxl: "h-32 w-32",
  xxxxxxl: "h-36 w-36",
  xxxxxxxl: "h-40 w-40",
  xxxxxxxxl: "h-44 w-44",
  xxxxxxxxxl: "h-48 w-48",
  xxxxxxxxxxl: "h-52 w-52",
  xxxxxxxxxxxl: "h-56 w-56",
  xxxxxxxxxxxxl: "h-60 w-60",
  xxxxxxxxxxxxxl: "h-64 w-64",
  xxxxxxxxxxxxxxl: "h-68 w-68",
  xxxxxxxxxxxxxxxl: "h-72 w-72",
  xxxxxxxxxxxxxxxxl: "h-76 w-76",
  xxxxxxxxxxxxxxxxxl: "h-80 w-80",
  xxxxxxxxxxxxxxxxxxl: "h-84 w-84",
  xxxxxxxxxxxxxxxxxxxl: "h-88 w-88",
}

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
}

export function Logo({ size = "md", className, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <Image src={logo} alt="Puffin Group" fill className="object-contain" />
      </div>
      {showText && <span className={cn("font-bold text-slate-800", textSizeClasses[size])}>Puffin Group</span>}
    </div>
  )
}
