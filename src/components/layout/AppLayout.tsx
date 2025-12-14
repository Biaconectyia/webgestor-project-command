import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutGrid,
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Bell,
  LogOut,
  User,
  Settings,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'leader', 'collaborator'] },
  { href: '/teams', label: 'Equipes', icon: Users, roles: ['admin'] },
  { href: '/projects', label: 'Projetos', icon: FolderKanban, roles: ['admin', 'leader'] },
  { href: '/tasks', label: 'Tarefas', icon: CheckSquare, roles: ['admin', 'leader', 'collaborator'] },
  { href: '/users', label: 'Usuários', icon: User, roles: ['admin'] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useSupabaseAuth();
  const { getUnreadNotificationsCount } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  
  const unreadCount = getUnreadNotificationsCount();
  
  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(profile?.role || 'collaborator')
  );

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const getRoleBadge = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Admin',
      leader: 'Líder',
      collaborator: 'Colaborador',
    };
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      admin: 'default',
      leader: 'secondary',
      collaborator: 'outline',
    };
    return <Badge variant={variants[role]}>{labels[role]}</Badge>;
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-primary">
              <LayoutGrid className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">WebGestor</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {profile?.nome?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.nome}
              </p>
              {profile?.role && getRoleBadge(profile.role)}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
          <h2 className="text-lg font-medium text-foreground">
            {filteredNavItems.find(item => 
              location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
            )?.label || 'Dashboard'}
          </h2>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
