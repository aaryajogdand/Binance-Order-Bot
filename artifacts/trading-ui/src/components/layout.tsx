import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Activity, LayoutDashboard, History, Zap, Settings2 } from "lucide-react";
import { useHealthCheck } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck();

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <Zap className="w-6 h-6 fill-current" />
            <span className="font-bold tracking-tight text-lg uppercase">Nexus Trade</span>
          </div>
        </div>
        
        <div className="p-4 flex-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Menu</div>
          <nav className="flex flex-col gap-1">
            <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Terminal" active={location === "/"} />
            <NavItem href="/history" icon={<History size={18} />} label="History" active={location === "/history"} />
            <NavItem href="/stats" icon={<Activity size={18} />} label="Analytics" active={location === "/stats"} />
          </nav>
        </div>

        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Settings2 size={16} />
              <span>System</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
              <span className="text-xs font-mono text-muted-foreground uppercase">{health?.status || 'OFFLINE'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
      {icon}
      {label}
    </Link>
  );
}
