import React from 'react';
import { useAuth } from './auth-provider';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { LogOut } from 'lucide-react';

export function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-cyan-400/50 transition-all">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={user.picture} 
              alt={user.name || user.email}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm font-semibold">
              {getInitials(user.name || user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-gray-900/95 backdrop-blur-xl border border-cyan-500/20 shadow-xl" align="end" forceMount>
        {/* Header con info del usuario */}
        <div className="flex items-center gap-3 p-3 border-b border-gray-700/50">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={user.picture} 
              alt={user.name || user.email}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm font-semibold">
              {getInitials(user.name || user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-semibold text-white text-sm">{user.name || 'Usuario'}</p>
            <p className="w-[180px] truncate text-xs text-gray-400">
              {user.email}
            </p>
          </div>
        </div>
        
        {/* Botón de Cerrar Sesión */}
        <div className="p-1">
        <DropdownMenuItem 
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer rounded-md transition-colors"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
            <span className="font-medium">Cerrar Sesión</span>
        </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}