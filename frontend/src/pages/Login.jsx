import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, LogIn } from 'lucide-react';
import { loginUser, clearError } from '../store/authSlice';
import { mergeCartOnLogin } from '../store/cartSlice';

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Clear errors on page mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Navigate to home on success
  useEffect(() => {
    if (isAuthenticated) {
      // Merge guest cart items
      const guestToken = localStorage.getItem('guest_token');
      if (guestToken) {
        dispatch(mergeCartOnLogin(guestToken));
      }
      navigate('/');
    }
  }, [isAuthenticated, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center relative px-4">
      {/* Background blur decorative circles */}
      <div className="absolute w-72 aspect-square bg-violet-600/10 blur-[120px] rounded-full top-1/4 left-1/4" />
      <div className="absolute w-72 aspect-square bg-pink-500/10 blur-[120px] rounded-full bottom-1/4 right-1/4" />

      <div className="glass-premium p-8 rounded-3xl border border-white/5 shadow-2xl max-w-md w-full z-10">
        <div className="text-center flex flex-col gap-2 mb-8">
          <h2 className="text-2xl font-black text-white">Welcome Back</h2>
          <p className="text-xs text-gray-400">Sign in to your E-Sphere account to continue</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl leading-normal">
            {error.errors
              ? Object.values(error.errors).flat().join(' ')
              : error.message || 'Login failed. Please check your credentials.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email Address</label>
            <div className="relative flex items-center">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input px-4 py-2.5 pl-10 rounded-xl text-xs text-gray-200"
              />
              <Mail className="absolute left-3.5 text-gray-400 w-4 h-4" />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Password</label>
              <a href="#" className="text-[10px] font-bold text-violet-400 hover:text-violet-300">Forgot?</a>
            </div>
            <div className="relative flex items-center">
              <input
                type="password"
                required
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input px-4 py-2.5 pl-10 rounded-xl text-xs text-gray-200"
              />
              <Lock className="absolute left-3.5 text-gray-400 w-4 h-4" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-violet-600/10 hover:shadow-violet-600/25"
          >
            {loading ? 'Authenticating...' : <><LogIn className="w-4 h-4" /> Sign In</>}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-violet-400 hover:text-violet-300 transition">
            Sign Up Now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
