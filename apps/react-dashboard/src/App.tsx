import { BrowserRouter, Routes, Route } from 'react-router-dom'
import UserManagementPage from './pages/UserManagement'
import AccountSettingsPage from './pages/AccountSettingsPage'
import DashboardPage from './pages/DashboardPage'
import ReportsPage from './pages/ReportsPage'
import InventoryPage from './pages/InventoryPage'
import MaintenancePage from './pages/MaintenancePage'
import DisposalPage from './pages/DisposalPage'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/users" element={<UserManagementPage />} />
                <Route path="/settings" element={<AccountSettingsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/disposal" element={<DisposalPage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
