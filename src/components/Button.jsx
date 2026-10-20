export default function Button({
  variant = "primary",
  disabled = false,
  onClick,
  type = "button",
  children,
  className = "",
  ...props
}) {
  const baseStyle =
    "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-[6px] text-[16px] px-[20px] py-[10px]";
  const variants = {
    primary: "bg-route text-white hover:opacity-90 active:scale-[0.98]",
    secondary: "bg-transparent border border-border text-ink hover:bg-black/5",
    danger: "bg-transparent text-danger hover:bg-danger/10",
  };

  const disabledStyle = disabled
    ? "opacity-50 cursor-not-allowed pointer-events-none"
    : "";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyle} ${
        variants[variant] || variants.primary
      } ${disabledStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
