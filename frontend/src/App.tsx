import { NavLink, Route, Routes } from "react-router-dom";
import { Home as HomeIcon, ScanLine, Library, CalendarCheck, User } from "lucide-react";
import Home from "./pages/Home";
import SkinProfile from "./pages/SkinProfile";
import Scanner from "./pages/Scanner";
import MyRack from "./pages/MyRack";
import Routines from "./pages/Routines";

const tabs = [
  { to: "/", label: "Home", Icon: HomeIcon },
  { to: "/scan", label: "Scan", Icon: ScanLine },
  { to: "/rack", label: "My Rack", Icon: Library },
  { to: "/routines", label: "Routines", Icon: CalendarCheck },
  { to: "/profile", label: "Profile", Icon: User },
];

export default function App() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <main className="flex-1 p-4 pb-24">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<SkinProfile />} />
          <Route path="/scan" element={<Scanner />} />
          <Route path="/rack" element={<MyRack />} />
          <Route path="/routines" element={<Routines />} />
        </Routes>
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md justify-around border-t border-neutral-200 bg-white py-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-xs ${
                isActive ? "text-green-700" : "text-neutral-500"
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
