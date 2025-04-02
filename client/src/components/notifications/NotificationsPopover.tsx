import React, { useState } from "react";
import { 
  Bell, 
  Briefcase, 
  Sparkles, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  MailIcon,
  XCircle 
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

type Notification = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'contact' | 'enrichment' | 'message' | 'system';
};

export function NotificationsPopover() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Contact enrichment complete',
      description: 'John Smith\'s profile has been updated with new data',
      time: '10 minutes ago',
      read: false,
      type: 'enrichment'
    },
    {
      id: '2',
      title: 'LinkedIn connection accepted',
      description: 'Sarah Miller accepted your connection request',
      time: '2 hours ago',
      read: false,
      type: 'contact'
    },
    {
      id: '3',
      title: 'AI message generation failed',
      description: 'Unable to generate message for Rob Johnson',
      time: '3 hours ago',
      read: true,
      type: 'message'
    },
    {
      id: '4',
      title: 'System update',
      description: 'New AI Writer features have been added',
      time: '1 day ago',
      read: true,
      type: 'system'
    }
  ]);
  
  const [isOpen, setIsOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast({
      title: "Notifications marked as read",
      description: "All notifications have been marked as read",
    });
  };
  
  const clearAll = () => {
    setNotifications([]);
    toast({
      title: "Notifications cleared",
      description: "All notifications have been cleared",
    });
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'contact':
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'enrichment':
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      case 'message':
        return <MailIcon className="h-4 w-4 text-green-500" />;
      case 'system':
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-1 rounded-full text-neutral-600 hover:bg-neutral-100">
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          )}
          <Bell size={18} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 flex items-center justify-between border-b">
          <h4 className="font-medium">Notifications</h4>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="h-8 px-2"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAll}
              disabled={notifications.length === 0}
              className="h-8 px-2"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-neutral-500">
            No notifications
          </div>
        ) : (
          <Tabs defaultValue="all">
            <div className="px-4 pt-2">
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                <TabsTrigger value="unread" className="flex-1">Unread</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all">
              <ScrollArea className="h-[300px]">
                <div className="p-4 space-y-2">
                  {notifications.map((notification) => (
                    <React.Fragment key={notification.id}>
                      <div className={`p-2 rounded-md ${notification.read ? 'opacity-70' : 'bg-neutral-50'}`}>
                        <div className="flex gap-3">
                          <div className="mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="space-y-1 flex-1">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-neutral-500">{notification.description}</p>
                            <p className="text-xs text-neutral-400">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                      <Separator />
                    </React.Fragment>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="unread">
              <ScrollArea className="h-[300px]">
                <div className="p-4 space-y-2">
                  {notifications.filter(n => !n.read).length === 0 ? (
                    <div className="p-4 text-center text-sm text-neutral-500">
                      No unread notifications
                    </div>
                  ) : (
                    notifications.filter(n => !n.read).map((notification) => (
                      <React.Fragment key={notification.id}>
                        <div className="p-2 rounded-md bg-neutral-50">
                          <div className="flex gap-3">
                            <div className="mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="space-y-1 flex-1">
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-xs text-neutral-500">{notification.description}</p>
                              <p className="text-xs text-neutral-400">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                        <Separator />
                      </React.Fragment>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </PopoverContent>
    </Popover>
  );
}