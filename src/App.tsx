import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AIPlanner } from './pages/AIPlanner';
import { BudgetManager } from './pages/BudgetManager';
import { Dashboard } from './pages/Dashboard';
import { GuestManagement } from './pages/GuestManagement';
import { MyEvents } from './pages/MyEvents';
import { Settings } from './pages/Settings';
import { TaskChecklist } from './pages/TaskChecklist';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="planner" element={<AIPlanner />} />
        <Route path="events" element={<MyEvents />} />
        <Route path="budget" element={<BudgetManager />} />
        <Route path="guests" element={<GuestManagement />} />
        <Route path="tasks" element={<TaskChecklist />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
