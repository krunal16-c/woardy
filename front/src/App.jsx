import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Wardrobe from './pages/Wardrobe';
import Calendar from './pages/Calendar';
import OutfitPlanner from './pages/OutfitPlanner';
import Laundry from './pages/Laundry';

function AppLayout() {
  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden font-sans" style={{ height: '100dvh' }}>
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/planner" element={<OutfitPlanner />} />
          <Route path="/laundry" element={<Laundry />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
