'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string | Date;
};

const typeStyles: Record<string, string> = {
  error: 'text-red-600',
  warning: 'text-amber-600',
  success: 'text-green-600',
  info: 'text-blue-600',
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [, startTransition] = useTransition();

  const unread = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => setNotifications(Array.isArray(data) ? data : []));
  }, []);

  const markRead = (id: number) => {
    startTransition(async () => {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    });
  };

  const markAll = () => {
    startTransition(async () => {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map(n => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={cn(
                  'flex flex-col items-start gap-0.5 px-3 py-2 cursor-pointer',
                  !n.isRead && 'bg-muted/50'
                )}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className={cn('text-xs font-semibold', typeStyles[n.type] ?? 'text-foreground')}>
                    {n.title}
                  </span>
                  {!n.isRead && (
                    <Badge variant="default" className="shrink-0 h-4 text-[9px]">
                      New
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
