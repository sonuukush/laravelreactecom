import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingCart, User, LogOut, LayoutDashboard, Search, Menu, X } from 'lucide-react';
import { logoutUser } from '../store/authSlice';
import { clearCartState } from '../store/cartSlice';

function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user, roles } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = items.reduce((total, item) => total + item.quantity, 0);
  const isAdmin = roles && roles.includes('admin');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery)}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(clearCartState());
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5 shadow-lg">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
        <span className="text-2xl font-extrabold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent tracking-wide">
          E-SPHERE
        </span>
      </Link>

      {/* Search Bar - Desktop */}
      <form onSubmit={handleSearch} className="hidden md:flex items-center relative w-1/3 max-w-md">
        <input
          type="text"
          placeholder="Search products, brands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full glass-input px-4 py-2 pl-10 rounded-full text-sm text-gray-200"
        />
        <Search className="absolute left-3.5 text-gray-400 w-4 h-4" />
      </form>

      {/* Navigation Links - Desktop */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium">
        <Link to="/catalog" className="text-gray-300 hover:text-white transition">
          Shop All
        </Link>
        {isAdmin && (
          <Link to="/admin" className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition">
            <LayoutDashboard className="w-4 h-4" /> Admin Panel
          </Link>
        )}
        
        {/* Cart */}
        <Link to="/cart" className="relative p-2 text-gray-300 hover:text-white transition">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-dark-100 animate-pulse">
              {cartCount}
            </span>
          )}
        </Link>

        {/* User Account / Auth */}
        {isAuthenticated ? (
          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            <Link to="/dashboard" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
              {user?.profile_picture ? (
                <img
                  src={`http://localhost:8000/storage/${user.profile_picture}`}
                  alt="avatar"
                  className="w-7 h-7 rounded-full object-cover border border-violet-500/30"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-violet-600/30 border border-violet-500/50 flex items-center justify-center">
                  <User className="w-4 h-4 text-violet-300" />
                </div>
              )}
              <span className="max-w-[120px] truncate">{user?.name}</span>
            </Link>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition p-2 cursor-pointer" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            <Link to="/login" className="text-gray-300 hover:text-white transition">
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-full transition shadow-md shadow-violet-600/10"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      {/* Hamburger Menu - Mobile */}
      <div className="flex md:hidden items-center gap-4">
        {/* Cart */}
        <Link to="/cart" className="relative p-2 text-gray-300 hover:text-white">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-dark-100">
              {cartCount}
            </span>
          )}
        </Link>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-300 hover:text-white">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full glass border-b border-white/5 py-6 px-6 flex flex-col gap-6 md:hidden animate-in slide-in-from-top duration-300">
          <form onSubmit={handleSearch} className="flex items-center relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input px-4 py-2.5 pl-10 rounded-full text-sm text-gray-200"
            />
            <Search className="absolute left-3.5 text-gray-400 w-4 h-4" />
          </form>

          <div className="flex flex-col gap-4 text-base font-semibold">
            <Link to="/catalog" className="text-gray-300 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>
              Shop All
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard className="w-4.5 h-4.5" /> Admin Panel
              </Link>
            )}
            <hr className="border-white/5" />
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2.5 text-gray-300 hover:text-white transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {user?.profile_picture ? (
                    <img
                      src={`http://localhost:8000/storage/${user.profile_picture}`}
                      alt="avatar"
                      className="w-7 h-7 rounded-full object-cover border border-violet-500/30"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                  <span>{user?.name} (Profile)</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 text-red-400 hover:text-red-300 transition text-left font-semibold cursor-pointer"
                >
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  className="text-center text-gray-300 hover:text-white transition py-2 rounded-full border border-white/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-center bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-full transition font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
