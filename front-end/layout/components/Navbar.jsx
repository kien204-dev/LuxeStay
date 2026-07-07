import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Navbar({ username, title, setSidebarOpen }) {

  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };

  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="bg-white px-3 md:px-6 py-3 shadow flex justify-between items-center">

      {/* Left */}
      <div className="flex items-center space-x-3">

        <button
          className="md:hidden text-2xl"
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </button>

        <h1 className="text-lg font-bold">{title}</h1>

      </div>

      {/* Right */}
      <div className="flex items-center space-x-4">

        <input
          type="text"
          placeholder="Search..."
          className="hidden md:block border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="relative cursor-pointer">
          🔔
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
            3
          </span>
        </div>

        <div className="relative" ref={menuRef}>

          <button
            onClick={() => setOpen(!open)}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white">
              {username.charAt(0)}
            </div>

            <span className="hidden md:block">{username}</span>

          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50">

              <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                Profile
              </div>

              <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                Settings
              </div>

              <div
                onClick={handleLogout}
                className="px-4 py-2 hover:bg-red-100 text-red-500 cursor-pointer"
              >
                Logout
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default Navbar;