import { NavLink, Route, Routes } from "react-router-dom";
import { Home as HomeIcon, Library, CalendarCheck, User } from "lucide-react";
import Home from "./pages/Home";
import SkinProfile from "./pages/SkinProfile";
import MyRack from "./pages/MyRack";
import Routines from "./pages/Routines";

const tabs = [
  { to: "/", label: "Home", Icon: HomeIcon },
  { to: "/rack", label: "My Rack", Icon: Library },
  { to: "/routines", label: "Routines", Icon: CalendarCheck },
  { to: "/profile", label: "Profile", Icon: User },
];

export default function App() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-white">
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<SkinProfile />} />
          <Route path="/rack" element={<MyRack />} />
          <Route path="/routines" element={<Routines />} />
        </Routes>
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md justify-around border-t border-neutral-100 bg-white py-3 pb-[env(safe-area-inset-bottom)] z-50">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-xs transition-colors ${
                isActive ? "text-[#6B2D40] font-medium" : "text-gray-400 hover:text-gray-600"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}