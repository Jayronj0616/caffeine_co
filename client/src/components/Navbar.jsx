import { Coffee, ShoppingBag, User, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { logout } from '../lib/api/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const handleLogout = () => {
    Swal.fire({
        title: 'Sign Out?',
        text: "Are you sure you want to log out?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#4A3B32',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Log Out',
        width: '24em',
        background: '#F5F5DC',
        color: '#4A3B32',
        customClass: {
            popup: 'font-serif border-2 border-[#D2B48C]',
            title: 'text-xl',
            confirmButton: 'uppercase tracking-widest px-4 py-2 text-sm'
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            await logout();
            navigate('/login');
        }
    });
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-parchment/80 backdrop-blur-md border-b border-oatmeal px-8 py-4 flex justify-between items-center transition-all">
      <Link to="/" className="flex items-center gap-2 group">
        <Coffee className="text-espresso group-hover:rotate-12 transition-transform duration-300" size={28} />
        <span className="text-xl font-serif tracking-widest uppercase text-espresso group-hover:text-bean transition-colors">Caffeine Co.</span>
      </Link>
      <div className="hidden md:flex gap-8 text-sm font-semibold uppercase tracking-wider text-espresso items-center">
        <Link to="/origins" className="hover:text-bean transition-colors duration-300 relative group">
            Origins
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-bean transition-all duration-300 group-hover:w-full"></span>
        </Link>
        <Link to="/menu" className="hover:text-bean transition-colors duration-300 relative group">
            Menu
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-bean transition-all duration-300 group-hover:w-full"></span>
        </Link>
        <Link to="/story" className="hover:text-bean transition-colors duration-300 relative group">
            Our Story
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-bean transition-all duration-300 group-hover:w-full"></span>
        </Link>
        
        {user ? (
            <>
                {isAdmin && (
                    <Link to="/admin" className="text-bean hover:text-espresso transition-colors duration-300 font-bold">
                        Admin
                    </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-1 hover:text-red-600 transition-colors">
                    <LogOut size={18} /> Logout
                </button>
            </>
        ) : (
            <Link to="/login" className="flex items-center gap-1 hover:text-bean transition-colors">
                <User size={18} /> Login
            </Link>
        )}

        <Link to="/cart">
            <ShoppingBag className="cursor-pointer hover:text-bean transition-colors duration-300 transform hover:scale-110" size={20} />
        </Link>
      </div>
    </nav>
  );
};
export default Navbar;
