function Button({
  children,
  onClick,
  type = "primary",
  htmlType = "button"
}) {
  const styles = {
    primary:
      "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg",

    danger:
      "bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg",

    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-800 shadow-sm"
  };

  return (
    <button
      type={htmlType} // ✅ QUAN TRỌNG
      onClick={onClick}
      className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:-translate-y-0.5 flex items-center gap-2 ${styles[type]}`}
    >
      {children}
    </button>
  );
}

export default Button;