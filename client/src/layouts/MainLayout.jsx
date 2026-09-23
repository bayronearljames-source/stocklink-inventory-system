import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export const MainLayout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Role-Scoped Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/80">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
