export default function Card({
  icon,
  title,
  description,
  linkText,
  size = "md",
  className = "",
}) {
  const iconBox = size === "sm" ? "h-9 w-9" : "h-11 w-11";

  return (
    <div
      className={[
        "flex items-center gap-3.5 rounded-[10px] border border-[#E2E4DF] bg-white/95",
        "p-4 shadow-[0_1px_2px_rgba(20,30,35,0.07)]",
        className,
      ].join(" ")}
    >
      <span
        className={`flex ${iconBox} flex-none items-center justify-center rounded-full bg-[#F3F2F7] text-[#564C8E]`}
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-bold text-[#21262B]">{title}</span>
        <span className="text-[13px] leading-relaxed text-[#5B6269]">
          {description}
        </span>
        {linkText && (
          <a className="mt-0.5 cursor-pointer text-[12.5px] font-semibold text-[#564C8E] no-underline hover:underline">
            {linkText} ›
          </a>
        )}
      </div>
    </div>
  );
}