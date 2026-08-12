import { Link } from 'react-router';
import { ChevronRight, LayoutDashboard } from 'lucide-react';

export default function AdminBreadcrumb({ page }) {
  return (
    <nav className="flex items-center gap-1.5 text-[13px] mb-5 text-[#9C8E76]">
      <Link to="/admin" className="flex items-center gap-1 font-semibold hover:text-[#DC2113] transition-colors">
        <LayoutDashboard size={14} strokeWidth={2.4} />
        Admin
      </Link>
      <ChevronRight size={13} strokeWidth={2.5} />
      <span className="font-semibold text-[#1C1613]">{page}</span>
    </nav>
  );
}
