import { Coffee, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-parchment/80 backdrop-blur-md border-b border-oatmeal px-8 py-4 flex justify-between items-center transition-all">
      <Link to="/" className="flex items-center gap-2 group">
        <Coffee className="text-espresso group-hover:rotate-12 transition-transform duration-300" size={28} />
        <span className="text-xl font-serif tracking-widest uppercase text-espresso group-hover:text-bean transition-colors">Caffeine Co.</span>
      </Link>
      <div className="hidden md:flex gap-8 text-sm font-semibold uppercase tracking-wider text-espresso">
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
        <ShoppingBag className="cursor-pointer hover:text-bean transition-colors duration-300 transform hover:scale-110" size={20} />
      </div>
    </nav>
  );
};
export default Navbar;
