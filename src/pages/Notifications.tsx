import React from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  CheckSquare, 
  Clock, 
  MessageSquare,
  CheckCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead, getTaskById, getProjectById } = useData();

  const userNotifications = notifications
    .filter(n => n.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = userNotifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <CheckSquare className="h-5 w-5 text-primary" />;
      case 'deadline_approaching':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'status_changed':
        return <CheckSquare className="h-5 w-5 text-success" />;
      case 'new_comment':
        return <MessageSquare className="h-5 w-5 text-info" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 
              ? `Você tem ${unreadCount} notificação(ões) não lida(s)`
              : 'Todas as notificações foram lidas'
            }
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllNotificationsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {userNotifications.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma notificação.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {userNotifications.map(notification => {
            const task = notification.relatedId ? getTaskById(notification.relatedId) : null;
            const project = task ? getProjectById(task.projectId) : null;
            
            return (
              <Card 
                key={notification.id} 
                className={`shadow-card transition-colors ${!notification.read ? 'bg-primary/5 border-primary/20' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{notification.title}</h3>
                        {!notification.read && (
                          <Badge variant="default" className="text-xs">Nova</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {task && project && (
                        <Link 
                          to={`/projects/${project.id}`}
                          className="text-sm text-primary hover:underline mt-1 inline-block"
                        >
                          Ver tarefa: {task.title}
                        </Link>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => markNotificationRead(notification.id)}
                      >
                        Marcar como lida
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
