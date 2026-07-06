import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Phone, Lock, UserPlus } from 'lucide-react';
import { registerUser, clearError } from '../store/authSlice';
import { mergeCartOnLogin } from '../store/cartSlice';

function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passError, setPassError] = useState('');

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      const guestToken = localStorage.getItem('guest_token');
      if (guestToken) {
        dispatch(mergeCartOnLogin(guestToken));
      }
      navigate('/');
    }
  }, [isAuthenticated, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPassError('');

    if (password !== passwordConfirmation) {
      setPassError('Password confirmation does not match.');
      return;
    }

    dispatch(registerUser({
      name,
      email,
      phone,
      password,
      password_confirmation: passwordConfirmation
    }));
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center relative px-4">
      <div className="absolute w-72 aspect-square bg-violet-600/10 blur-[120px] rounded-full top-1/4 left-1/4" />
      <div className="absolute w-72 aspect-square bg-pink-500/10 blur-[120px] rounded-full bottom-1/4 right-1/4" />

      <div className="glass-premium p-8 rounded-3xl border border-white/5 shadow-2xl max-w-md w-full z-10">
        <div className="text-center flex flex-col gap-2 mb-6">
          <h2 className="text-2xl font-black text-white">Create Account</h2>
          <p className="text-xs text-gray-400">Join E-Sphere to browse and checkout items</p>
        </div>

        {(error || passError) && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl leading-normal">
            {passError || (error.errors
              ? Object.values(error.errors).flat().join(' ')
              : error.message || 'Registration failed.')}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Full Name</label>
            <div className="relative flex items-center">
              <input
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full glass-input px-4 py-2.5 pl-10 rounded-xl text-xs text-gray-200"
              />
              <User className="absolute left-3.5 text-gray-400 w-4 h-4" />
            </div>
          </div>

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

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Phone Number</label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full glass-input px-4 py-2.5 pl-10 rounded-xl text-xs text-gray-200"
              />
              <Phone className="absolute left-3.5 text-gray-400 w-4 h-4" />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Password</label>
            <div className="relative flex items-center">
              <input
                type="password"
                required
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input px-4 py-2.5 pl-10 rounded-xl text-xs text-gray-200"
              />
              <Lock className="absolute left-3.5 text-gray-400 w-4 h-4" />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Confirm Password</label>
            <div className="relative flex items-center">
              <input
                type="password"
                required
                placeholder="Repeat password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
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
            {loading ? 'Registering...' : <><UserPlus className="w-4 h-4" /> Sign Up</>}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-violet-400 hover:text-violet-300 transition">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
