import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { MapPin, CreditCard, ChevronRight, CheckCircle2, ChevronLeft, Plus, Check } from 'lucide-react';
import api from '../utils/api';
import { fetchCart } from '../store/cartSlice';

function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);

  // States
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Address, 2: Payment, 3: Review
  
  // Totals calculations (similar to cart page)
  const [couponCode, setCouponCode] = useState(localStorage.getItem('checkout_coupon') || '');
  const [discount, setDiscount] = useState(0);

  // Address Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
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

  // Card Mock States
  const [cardInfo, setCardInfo] = useState({ number: '', expiry: '', cvv: '' });
  const [upiId, setUpiId] = useState('');

  // Transaction States
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null); // Will hold the completed order details

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data);
      const defaultAddr = res.data.find((a) => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (res.data.length > 0) {
        setSelectedAddressId(res.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const fetchDiscount = async () => {
    if (!couponCode) return;
    try {
      const res = await api.post('/checkout/verify-coupon', {
        code: couponCode,
        subtotal,
      });
      setDiscount(res.data.discount);
    } catch (err) {
      localStorage.removeItem('checkout_coupon');
      setCouponCode('');
      setDiscount(0);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Cart Subtotal
  const subtotal = items.reduce((total, item) => {
    const productPrice = parseFloat(item.product.discount_price || item.product.price);
    const variantModifier = item.variant ? parseFloat(item.variant.price_modifier || 0) : 0;
    return total + (productPrice + variantModifier) * item.quantity;
  }, 0);

  useEffect(() => {
    fetchDiscount();
  }, [couponCode, subtotal]);

  const tax = Math.max(0, subtotal - discount) * 0.05;
  const shipping = Math.max(0, subtotal - discount) < 150 ? 10.00 : 0.00;
  const total = Math.max(0, subtotal - discount) + tax + shipping;

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/addresses', newAddress);
      fetchAddresses();
      setSelectedAddressId(res.data.address.id);
      setShowAddForm(false);
      setNewAddress({
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
      console.error('Failed to create address:', err);
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const orderPayload = {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        coupon_code: couponCode || null,
        notes: 'Delivered via React SPA checkout flow',
      };

      const res = await api.post('/checkout/place-order', orderPayload);
      setOrderSuccess(res.data.order);
      localStorage.removeItem('checkout_coupon');
      dispatch(fetchCart()); // Refresh cart to empty state
    } catch (err) {
      alert(err.response?.data?.message || 'Error occurred while placing order.');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="glass-premium rounded-3xl p-16 text-center max-w-2xl mx-auto flex flex-col items-center justify-center border border-white/5 shadow-2xl animate-fade-in">
        <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-white mt-6">Order Placed Successfully!</h2>
        <p className="text-xs text-gray-400 mt-2 max-w-sm leading-relaxed">
          Thank you for your purchase. Your order <span className="font-extrabold text-violet-400">{orderSuccess.order_number}</span> has been confirmed. A receipt will be sent shortly.
        </p>
        <div className="flex gap-4 mt-8 w-full justify-center">
          <Link
            to="/dashboard"
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-6 py-3 rounded-xl transition cursor-pointer"
          >
            Track Order
          </Link>
          <Link
            to="/"
            className="glass hover:bg-white/5 text-gray-300 text-xs font-bold px-6 py-3 rounded-xl transition cursor-pointer"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-black text-white">Checkout</h1>

      {/* Checkout Steps Progress Bar */}
      <div className="flex items-center gap-4 text-xs font-bold text-gray-500 border-b border-white/5 pb-4">
        <span className={checkoutStep === 1 ? 'text-violet-400' : 'text-gray-300'}>1. Delivery Address</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
        <span className={checkoutStep === 2 ? 'text-violet-400' : checkoutStep > 2 ? 'text-gray-300' : ''}>2. Payment Method</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
        <span className={checkoutStep === 3 ? 'text-violet-400' : ''}>3. Review & Order</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Wizards */}
        <div className="lg:w-2/3 flex flex-col gap-6">
          {/* STEP 1: Address Selection */}
          {checkoutStep === 1 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-violet-400" /> Select Delivery Address
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`glass-premium p-5 rounded-2xl border transition cursor-pointer flex justify-between items-start ${
                      selectedAddressId === addr.id
                        ? 'border-violet-500 bg-violet-600/5'
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="text-xs text-gray-400 flex flex-col gap-1">
                      <div className="flex items-center gap-2 font-bold text-gray-100 mb-1">
                        <span>{addr.name}</span>
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full capitalize text-gray-400">{addr.type}</span>
                      </div>
                      <span>{addr.address_line1}</span>
                      {addr.address_line2 && <span>{addr.address_line2}</span>}
                      <span>{addr.city}, {addr.state} - {addr.postal_code}</span>
                      <span>Phone: {addr.phone}</span>
                    </div>

                    {selectedAddressId === addr.id && (
                      <div className="p-1 bg-violet-600 text-white rounded-full">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Add new address dummy block */}
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="glass-premium p-5 rounded-2xl border border-dashed border-white/10 hover:border-violet-500/30 flex flex-col items-center justify-center gap-2.5 text-gray-400 hover:text-violet-400 transition cursor-pointer h-full"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-xs font-bold">Add New Address</span>
                  </button>
                )}
              </div>

              {/* Add Address Form */}
              {showAddForm && (
                <form onSubmit={handleAddAddress} className="glass-premium p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-white mb-2">New Address Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Address Type</label>
                      <select
                        value={newAddress.type}
                        onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                        className="glass px-3 py-2 rounded-xl text-xs text-gray-300 cursor-pointer"
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
                        value={newAddress.name}
                        onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
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
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Country</label>
                      <input
                        type="text"
                        required
                        value={newAddress.country}
                        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                        className="glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Address Line 1</label>
                    <input
                      type="text"
                      required
                      value={newAddress.address_line1}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                      className="glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={newAddress.address_line2}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                      className="glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-400">City</label>
                      <input
                        type="text"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-400">State</label>
                      <input
                        type="text"
                        required
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Zip / Postal Code</label>
                      <input
                        type="text"
                        required
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                        className="glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 mt-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={newAddress.is_default}
                      onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                      className="rounded accent-violet-600 bg-white/5 border-white/10"
                    />
                    <label htmlFor="isDefault" className="text-xs text-gray-300 cursor-pointer">Set as default delivery address</label>
                  </div>

                  <div className="flex gap-3 justify-end mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
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
              )}

              {/* Continue button */}
              <button
                disabled={!selectedAddressId}
                onClick={() => setCheckoutStep(2)}
                className="mt-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold py-3 px-8 rounded-xl w-fit flex items-center gap-2 self-end cursor-pointer shadow-lg shadow-violet-600/10"
              >
                Proceed to Payment <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Payment Options Selection */}
          {checkoutStep === 2 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-violet-400" /> Select Payment Method
              </h2>

              <div className="flex flex-col gap-4">
                {[
                  { id: 'COD', name: 'Cash on Delivery (COD)', desc: 'Pay with cash upon delivery.' },
                  { id: 'Card', name: 'Credit / Debit Card', desc: 'Mock credit card payment processing.' },
                  { id: 'UPI', name: 'Unified Payments Interface (UPI)', desc: 'Instant UPI mock validation.' },
                  { id: 'PayPal', name: 'PayPal Account', desc: 'Secure checkout with your PayPal wallet.' },
                ].map((pay) => (
                  <div key={pay.id} className="glass-premium rounded-2xl overflow-hidden border border-white/5 shadow-md">
                    <div
                      onClick={() => setPaymentMethod(pay.id)}
                      className={`p-5 flex items-center justify-between cursor-pointer transition ${
                        paymentMethod === pay.id ? 'bg-violet-600/5' : 'hover:bg-white/2'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === pay.id}
                          onChange={() => setPaymentMethod(pay.id)}
                          className="accent-violet-600"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white">{pay.name}</h4>
                          <span className="text-[10px] text-gray-500 font-medium mt-0.5 block">{pay.desc}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expand inputs based on payment */}
                    {paymentMethod === pay.id && pay.id === 'Card' && (
                      <div className="px-10 pb-5 pt-1 border-t border-white/5 grid grid-cols-3 gap-4">
                        <div className="col-span-3 flex flex-col gap-1.5">
                          <label className="text-[9px] uppercase font-extrabold text-gray-400">Card Number</label>
                          <input
                            type="text"
                            placeholder="1234 5678 1234 5678"
                            value={cardInfo.number}
                            onChange={(e) => setCardInfo({ ...cardInfo, number: e.target.value })}
                            className="glass-input px-3 py-1.5 rounded-lg text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] uppercase font-extrabold text-gray-400">Expiry</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardInfo.expiry}
                            onChange={(e) => setCardInfo({ ...cardInfo, expiry: e.target.value })}
                            className="glass-input px-3 py-1.5 rounded-lg text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] uppercase font-extrabold text-gray-400">CVV</label>
                          <input
                            type="password"
                            placeholder="***"
                            value={cardInfo.cvv}
                            onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })}
                            className="glass-input px-3 py-1.5 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === pay.id && pay.id === 'UPI' && (
                      <div className="px-10 pb-5 pt-1 border-t border-white/5 flex flex-col gap-1.5">
                        <label className="text-[9px] uppercase font-extrabold text-gray-400">UPI Address (VPA)</label>
                        <input
                          type="text"
                          placeholder="username@upi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="glass-input px-3 py-1.5 rounded-lg text-xs max-w-xs"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Navigation Actions */}
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setCheckoutStep(1)}
                  className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <ChevronLeft className="w-4.5 h-4.5" /> Back to Delivery
                </button>
                <button
                  onClick={() => setCheckoutStep(3)}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-3 px-8 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-violet-600/10"
                >
                  Review Order <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review and Place */}
          {checkoutStep === 3 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-bold text-white">Review Your Order</h2>
              
              {/* Order items lists review */}
              <div className="flex flex-col gap-3">
                {items.map((item) => {
                  const productPrice = parseFloat(item.product.discount_price || item.product.price);
                  const variantModifier = item.variant ? parseFloat(item.variant.price_modifier || 0) : 0;
                  const itemUnitPrice = productPrice + variantModifier;

                  return (
                    <div key={item.id} className="glass-premium p-4 rounded-xl border border-white/5 flex items-center justify-between text-xs text-gray-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden glass border border-white/5 shrink-0">
                          <img
                            src={
                              item.product.images && item.product.images.length > 0 
                                ? `http://localhost:8000/storage/${item.product.images[0].image_path}`
                                : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=100&auto=format&fit=crop'
                            }
                            alt="product thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-gray-100">{item.product.name}</span>
                          <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5">
                            {item.variant && <span>{item.variant.name}: {item.variant.value}</span>}
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-white">${(itemUnitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Delivery Details and Payment Method summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-premium p-5 rounded-2xl border border-white/5 text-xs flex flex-col gap-2">
                  <h4 className="font-bold text-gray-200">Delivery Information</h4>
                  {addresses.find((a) => a.id === selectedAddressId) ? (
                    (() => {
                      const addr = addresses.find((a) => a.id === selectedAddressId);
                      return (
                        <div className="text-gray-400 flex flex-col gap-0.5 mt-1">
                          <span className="font-semibold text-gray-100">{addr.name}</span>
                          <span>{addr.address_line1}</span>
                          {addr.address_line2 && <span>{addr.address_line2}</span>}
                          <span>{addr.city}, {addr.state} - {addr.postal_code}</span>
                        </div>
                      );
                    })()
                  ) : (
                    <span className="text-red-400">No address selected.</span>
                  )}
                </div>

                <div className="glass-premium p-5 rounded-2xl border border-white/5 text-xs flex flex-col gap-2">
                  <h4 className="font-bold text-gray-200">Payment Information</h4>
                  <div className="text-gray-400 flex flex-col gap-0.5 mt-1">
                    <span className="font-semibold text-gray-100">Method: {paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : paymentMethod}</span>
                    {paymentMethod === 'Card' && <span>Card: **** **** **** {cardInfo.number.slice(-4) || '1234'}</span>}
                    {paymentMethod === 'UPI' && <span>UPI ID: {upiId || 'username@upi'}</span>}
                  </div>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setCheckoutStep(2)}
                  className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <ChevronLeft className="w-4.5 h-4.5" /> Back to Payment
                </button>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold text-xs py-3.5 px-8 rounded-xl cursor-pointer transition shadow-lg shadow-violet-600/15"
                >
                  {loading ? 'Processing Transaction...' : 'Confirm & Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Totals summary sticky card */}
        <div className="lg:w-1/3">
          <div className="glass-premium p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col gap-4 sticky top-24">
            <h3 className="text-sm font-black text-white border-b border-white/5 pb-3">Checkout Summary</h3>

            <div className="flex flex-col gap-2.5 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-gray-200">${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span className="font-bold">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax (5% GST)</span>
                <span className="font-bold text-gray-200">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-bold text-gray-200">
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-3.5 flex justify-between items-baseline mt-1.5">
              <span className="text-sm font-bold text-white">Grand Total</span>
              <span className="text-xl font-black text-violet-400">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
