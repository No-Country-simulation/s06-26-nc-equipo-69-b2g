const SIZES = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-[15px] gap-2",
};

const VARIANTS = {
  primary: "bg-[#564C8E] text-white border-transparent hover:bg-[#6259A0]",
  secondary:
    "bg-white/90 text-[#564C8E] border-[#C7CBC4] backdrop-blur-sm hover:border-[#564C8E] hover:bg-[#F3F2F7]",
  ghost:
    "bg-transparent text-[#5B6269] border-transparent hover:bg-[#F5F6F4] hover:text-[#21262B]",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon = null,
  fullWidth = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center rounded-[6px] border font-semibold whitespace-nowrap",
        "transition-colors duration-150 cursor-pointer select-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#564C8E]/30",
        "disabled:cursor-not-allowed disabled:opacity-45",
        SIZES[size],
        VARIANTS[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}