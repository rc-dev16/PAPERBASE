import { Link, useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';

export const DashboardHeader = () => {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const navigate = useNavigate();

  const userInitials =
    user?.firstName?.[0] ||
    user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() ||
    'U';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F2F0E9] border-b-2 border-black">
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 lg:px-16 h-16 md:h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/PB.png" alt="PB Logo" className="h-6 md:h-8 w-auto" />
          <span className="font-sans text-xl md:text-2xl font-black tracking-tighter text-[#111111] uppercase">
            PAPERBASE<span className="text-[#FF3B30]">.</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative">
                <div className="absolute inset-0 bg-[#111111] translate-x-1 translate-y-1"></div>
                <div className="relative h-10 w-10 md:h-12 md:w-12 bg-[#FF3B30] border-2 border-black flex items-center justify-center cursor-pointer hover:bg-[#E6342A] transition-colors">
                  <span className="text-white font-black text-sm md:text-base font-sans">
                    {userInitials}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => openUserProfile()}>
                <User className="mr-2 h-4 w-4" />
                PROFILE
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                SETTINGS
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => signOut()}
                className="text-[#FF3B30] hover:bg-[#FFF5F5] focus:bg-[#FFF5F5]"
              >
                <LogOut className="mr-2 h-4 w-4" />
                SIGN OUT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};
