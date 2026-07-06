import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User as UserIcon, MapPin, ShoppingBag, Plus, Trash2, Key, Edit, Save, ShieldAlert, Loader } from 'lucide-react';
import api from '../utils/api';
import { fetchProfile, updateUserProfile } from '../store/authSlice';

function AccountDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Tabs: 'profile', 'addresses', 'orders'
  const [activeTab, setActiveTab] = useState('orders');

  // API Lists
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Profile Edit Form States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profilePic, setProfilePic] = useState(null);
  const [profileMsg, setProfileMsg] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password Change Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Address Dialog States
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressData, setAddressData] = useState({
    type: 'shipping',
    name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    is_default: false,
  });

  // Tracked order detail overlay modal state
  const [trackedOrder, setTrackedOrder] = useState(null);

  // Sync profile fields if redux user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  // Load orders & addresses based on tab active selection
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Error loading customer orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data);
    } catch (err) {
      console.error('Error loading customer addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'addresses') {
      loadAddresses();
    }
  }, [activeTab]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setUpdatingProfile(true);

    const formData = new FormData();
    formData.append('name', profileName);
    formData.append('email', profileEmail);
    formData.append('phone', profilePhone);
    if (profilePic) {
      formData.append('profile_picture', profilePic);
    }

    try {
      await dispatch(updateUserProfile(formData)).unwrap();
      setProfileMsg('Profile updated successfully.');
      setProfilePic(null);
    } catch (err) {
      setProfileMsg('Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setPassError('');
    if (newPassword !== confirmPassword) {
      setPassError('Password confirmation does not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.post('/profile/password', {
        current_password: oldPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setPassMsg('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassError(err.response?.data?.message || 'Current password incorrect.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        await api.put(`/addresses/${editingAddressId}`, addressData);
      } else {
        await api.post('/addresses', addressData);
      }
      loadAddresses();
      setShowAddressForm(false);
      setEditingAddressId(null);
      setAddressData({
        type: 'shipping',
        name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'United States',
        is_default: false,
      });
    } catch (err) {
      console.error('Failed to save address:', err);
    }
  };

  const handleEditAddressClick = (addr) => {
    setEditingAddressId(addr.id);
    setAddressData({
      type: addr.type,
      name: addr.name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      country: addr.country,
      is_default: addr.is_default,
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      loadAddresses();
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.post(`/orders/${orderId}/cancel`);
      loadOrders();
      if (trackedOrder && trackedOrder.id === orderId) {
        // Update track details modal if open
        const updated = await api.get(`/orders/${orderId}`);
        setTrackedOrder(updated.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order.');
    }
  };

  const handleTrackOrderClick = async (id) => {
    try {
      const res = await api.get(`/orders/${id}`);
      setTrackedOrder(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Status mapping to progress bar colors
  const statusSteps = {
    pending: 1,
    processing: 2,
    shipped: 3,
    delivered: 4,
    cancelled: 0,
    returned: 0
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar navigation tabs */}
      <aside className="w-full md:w-64 shrink-0 glass-premium p-6 rounded-2xl border border-white/5 flex flex-col gap-6 h-fit">
        <div className="flex items-center gap-3">
          {user?.profile_picture ? (
            <img
              src={`http://localhost:8000/storage/${user.profile_picture}`}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover border border-violet-500/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-sm font-extrabold text-violet-300">
              {user?.name[0].toUpperCase()}
            </div>
          )}
          <div className="overflow-hidden">
            <h3 className="text-sm font-bold text-white truncate">{user?.name}</h3>
            <span className="text-[10px] text-gray-500 block truncate">{user?.email}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 font-semibold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left text-xs transition cursor-pointer ${
              activeTab === 'orders' ? 'bg-violet-600 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingBag className="w-4.5 h-4.5" /> Order History
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left text-xs transition cursor-pointer ${
              activeTab === 'addresses' ? 'bg-violet-600 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <MapPin className="w-4.5 h-4.5" /> Address Book
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left text-xs transition cursor-pointer ${
              activeTab === 'profile' ? 'bg-violet-600 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserIcon className="w-4.5 h-4.5" /> Account Settings
          </button>
        </div>
      </aside>

      {/* Main Tab Content Panel */}
      <div className="flex-grow flex flex-col gap-6">
        {/* TABS 1: Order History */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white">Your Orders</h2>

            {loadingOrders ? (
              <div className="flex justify-center py-16"><Loader className="w-8 h-8 text-violet-400 animate-spin" /></div>
            ) : orders.length === 0 ? (
              <div className="glass-premium p-12 rounded-2xl text-center text-xs text-gray-400 border border-white/5">
                No orders placed yet.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {orders.map((ord) => (
                  <div key={ord.id} className="glass-premium p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                    <div className="text-xs text-gray-400 flex flex-col gap-1 w-full sm:w-1/2">
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-white text-sm">{ord.order_number}</span>
                        <span className={`text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                          ord.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                          ord.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-violet-500/10 text-violet-400'
                        }`}>{ord.status}</span>
                      </div>
                      <span className="mt-1">Placed on: {new Date(ord.created_at).toLocaleDateString()}</span>
                      <span>Total: <span className="font-bold text-gray-200">${parseFloat(ord.total).toFixed(2)}</span> ({ord.items ? ord.items.reduce((acc, i) => acc + i.quantity, 0) : 0} items)</span>
                    </div>

                    <div className="flex gap-3.5 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleTrackOrderClick(ord.id)}
                        className="glass hover:bg-white/5 text-gray-300 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                      >
                        Track Order
                      </button>
                      {['pending', 'processing'].includes(ord.status) && (
                        <button
                          onClick={() => handleCancelOrder(ord.id)}
                          className="bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-400 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TABS 2: Address Book */}
        {activeTab === 'addresses' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Saved Addresses</h2>
              {!showAddressForm && (
                <button
                  onClick={() => { setEditingAddressId(null); setShowAddressForm(true); }}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Address
                </button>
              )}
            </div>

            {loadingAddresses ? (
              <div className="flex justify-center py-16"><Loader className="w-8 h-8 text-violet-400 animate-spin" /></div>
            ) : showAddressForm ? (
              <form onSubmit={handleAddressSubmit} className="glass-premium p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white">{editingAddressId ? 'Edit Address' : 'New Address Details'}</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Address Type</label>
                    <select
                      value={addressData.type}
                      onChange={(e) => setAddressData({ ...addressData, type: e.target.value })}
                      className="glass px-3 py-2 rounded-xl text-xs text-gray-300"
                    >
                      <option value="shipping">Shipping</option>
                      <option value="billing">Billing</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Recipient Name</label>
                    <input
                      type="text"
                      required
                      value={addressData.name}
                      onChange={(e) => setAddressData({ ...addressData, name: e.target.value })}
                      className="glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={addressData.phone}
                      onChange={(e) => setAddressData({ ...addressData, phone: e.target.value })}
                      className="glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Country</label>
                    <input
                      type="text"
                      required
                      value={addressData.country}
                      onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                      className="glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400">Address Line 1</label>
                  <input
                    type="text"
                    required
                    value={addressData.address_line1}
                    onChange={(e) => setAddressData({ ...addressData, address_line1: e.target.value })}
                    className="glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={addressData.address_line2}
                    onChange={(e) => setAddressData({ ...addressData, address_line2: e.target.value })}
                    className="glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">City</label>
                    <input
                      type="text"
                      required
                      value={addressData.city}
                      onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                      className="glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">State</label>
                    <input
                      type="text"
                      required
                      value={addressData.state}
                      onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                      className="glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Zip / Postal Code</label>
                    <input
                      type="text"
                      required
                      value={addressData.postal_code}
                      onChange={(e) => setAddressData({ ...addressData, postal_code: e.target.value })}
                      className="glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mt-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={addressData.is_default}
                    onChange={(e) => setAddressData({ ...addressData, is_default: e.target.checked })}
                    className="rounded accent-violet-600 bg-white/5 border-white/10"
                  />
                  <label htmlFor="isDefault" className="text-xs text-gray-300 cursor-pointer">Set as default address</label>
                </div>

                <div className="flex gap-3 justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => { setShowAddressForm(false); setEditingAddressId(null); }}
                    className="glass px-5 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 text-gray-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-5 py-2 rounded-xl cursor-pointer"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            ) : addresses.length === 0 ? (
              <div className="glass-premium p-12 rounded-2xl text-center text-xs text-gray-400 border border-white/5">
                No addresses saved yet. Add one to speed up checkout.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="glass-premium p-5 rounded-2xl border border-white/5 flex flex-col justify-between shadow-md relative">
                    <div className="text-xs text-gray-400 flex flex-col gap-1">
                      <div className="flex items-center gap-2 font-bold text-gray-100 mb-1">
                        <span>{addr.name}</span>
                        {addr.is_default && <span className="text-[9px] bg-violet-600/20 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full font-bold">Default</span>}
                      </div>
                      <span>{addr.address_line1}</span>
                      {addr.address_line2 && <span>{addr.address_line2}</span>}
                      <span>{addr.city}, {addr.state} - {addr.postal_code}</span>
                      <span>Phone: {addr.phone}</span>
                    </div>

                    <div className="flex gap-3 justify-end mt-4 pt-3 border-t border-white/5">
                      <button
                        onClick={() => handleEditAddressClick(addr)}
                        className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-violet-400 transition cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-red-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TABS 3: Profile and password settings */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Edit details form */}
            <form onSubmit={handleProfileSubmit} className="glass-premium p-6 rounded-2xl border border-white/5 flex flex-col gap-4 shadow-md h-fit">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2"><UserIcon className="w-4.5 h-4.5 text-violet-400" /> Edit Profile Details</h3>
              {profileMsg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-medium">{profileMsg}</div>}
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400">Phone Number</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400">Profile Picture</label>
                <input
                  type="file"
                  onChange={(e) => setProfilePic(e.target.files[0])}
                  className="text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-500 file:cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="w-full mt-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Profile Details
              </button>
            </form>

            {/* Change password form */}
            <form onSubmit={handlePasswordSubmit} className="glass-premium p-6 rounded-2xl border border-white/5 flex flex-col gap-4 shadow-md h-fit">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2"><Key className="w-4.5 h-4.5 text-violet-400" /> Change Password</h3>
              
              {passMsg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-medium">{passMsg}</div>}
              {passError && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium">{passError}</div>}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                />
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full mt-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Update Password
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Track Order detail overlay Modal */}
      {trackedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-300/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-premium p-6 rounded-3xl border border-white/5 max-w-lg w-full flex flex-col gap-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-sm font-black text-white">Track Order {trackedOrder.order_number}</h3>
                <span className="text-[10px] text-gray-500 block mt-0.5">Placed on {new Date(trackedOrder.created_at).toLocaleDateString()}</span>
              </div>
              <button
                onClick={() => setTrackedOrder(null)}
                className="text-xs font-bold text-gray-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Tracker Stepper UI */}
            {['cancelled', 'returned'].includes(trackedOrder.status) ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/15 rounded-2xl text-rose-400 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> This order has been {trackedOrder.status}.
              </div>
            ) : (
              <div className="flex items-center justify-between relative px-2 py-4">
                {/* Horizontal progress bar background */}
                <div className="absolute left-6 right-6 top-[2.25rem] h-0.5 bg-gray-700 z-0" />
                <div
                  className="absolute left-6 top-[2.25rem] h-0.5 bg-violet-600 transition-all duration-500 z-0"
                  style={{ width: `${((statusSteps[trackedOrder.status] - 1) / 3) * 100}%` }}
                />

                {[
                  { id: 'pending', name: 'Placed' },
                  { id: 'processing', name: 'Confirmed' },
                  { id: 'shipped', name: 'Shipped' },
                  { id: 'delivered', name: 'Delivered' }
                ].map((step, idx) => {
                  const isActive = statusSteps[trackedOrder.status] >= idx + 1;
                  return (
                    <div key={step.id} className="flex flex-col items-center gap-2 z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-[10px] transition ${
                        isActive
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-dark-100 border-gray-700 text-gray-500'
                      }`}>
                        {isActive ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <span className={`text-[10px] font-bold ${isActive ? 'text-violet-400' : 'text-gray-500'}`}>{step.name}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Items details table */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Items in Order</span>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {trackedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-200">{item.product?.name || 'Deleted Product'}</span>
                      {item.variant && <span className="text-[9px] text-gray-500 font-semibold">{item.variant.name}: {item.variant.value}</span>}
                    </div>
                    <span className="font-bold text-white">{item.quantity} x ${parseFloat(item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary cost column */}
            <div className="flex flex-col gap-2.5 text-xs text-gray-400 bg-white/2 p-4 rounded-2xl border border-white/5 mt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-gray-200">${parseFloat(trackedOrder.subtotal).toFixed(2)}</span>
              </div>
              {parseFloat(trackedOrder.discount) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span className="font-bold">-${parseFloat(trackedOrder.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-bold text-gray-200">${parseFloat(trackedOrder.tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-bold text-gray-200">
                  {parseFloat(trackedOrder.shipping) === 0 ? 'FREE' : `$${parseFloat(trackedOrder.shipping).toFixed(2)}`}
                </span>
              </div>
              <div className="border-t border-white/5 pt-2 mt-1 flex justify-between font-bold text-white text-sm">
                <span>Total Amount</span>
                <span className="text-violet-400">${parseFloat(trackedOrder.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountDashboard;
