import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Wardrobe from './pages/Wardrobe';
import Calendar from './pages/Calendar';
import OutfitPlanner from './pages/OutfitPlanner';
import Laundry from './pages/Laundry';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-stone-50 overflow-hidden font-sans">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/wardrobe" element={<Wardrobe />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/planner" element={<OutfitPlanner />} />
            <Route path="/laundry" element={<Laundry />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
