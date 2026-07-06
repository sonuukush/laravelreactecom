import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Percent } from 'lucide-react';
import { updateCartQuantity, removeFromCart } from '../store/cartSlice';
import api from '../utils/api';

function CartPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.cart);

  // Coupon States
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Cart Calculations
  const subtotal = items.reduce((total, item) => {
    const productPrice = parseFloat(item.product.discount_price || item.product.price);
    const variantModifier = item.variant ? parseFloat(item.variant.price_modifier || 0) : 0;
    return total + (productPrice + variantModifier) * item.quantity;
  }, 0);

  const discount = couponDiscount;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * 0.05; // 5% GST
  const shipping = items.length > 0 && taxableAmount < 150 ? 10.00 : 0.00;
  const grandTotal = taxableAmount + tax + shipping;

  const handleQtyChange = (itemId, currentQty, stock, increment) => {
    const newQty = increment ? currentQty + 1 : currentQty - 1;
    if (newQty < 1) return;
    if (newQty > stock) return;
    dispatch(updateCartQuantity({ id: itemId, quantity: newQty }));
  };

  const handleRemove = (itemId) => {
    dispatch(removeFromCart(itemId));
  };

  const applyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    if (!couponCode.trim()) return;

    try {
      const res = await api.post('/checkout/verify-coupon', {
        code: couponCode,
        subtotal,
      });
      setActiveCoupon(res.data.coupon);
      setCouponDiscount(res.data.discount);
      setCouponSuccess(`Coupon "${res.data.coupon.code}" applied! Save $${res.data.discount}`);
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code.');
      setCouponDiscount(0);
      setActiveCoupon(null);
    }
  };

  const handleCheckoutRedirect = () => {
    // Save coupon details in session/local storage for CheckoutPage consumption
    if (activeCoupon) {
      localStorage.setItem('checkout_coupon', activeCoupon.code);
    } else {
      localStorage.removeItem('checkout_coupon');
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="glass-premium rounded-3xl p-16 text-center max-w-2xl mx-auto flex flex-col items-center justify-center border border-white/5 shadow-2xl">
        <div className="p-4 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mt-6">Your Cart is Empty</h2>
        <p className="text-xs text-gray-400 mt-2 max-w-xs leading-relaxed">Looks like you haven't added anything to your cart yet. Let's find some premium items for you!</p>
        <Link
          to="/catalog"
          className="mt-8 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-8 py-3 rounded-full transition shadow-lg shadow-violet-600/10"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-black text-white">Your Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Items list */}
        <div className="lg:w-2/3 flex flex-col gap-4">
          {items.map((item) => {
            const productPrice = parseFloat(item.product.discount_price || item.product.price);
            const variantModifier = item.variant ? parseFloat(item.variant.price_modifier || 0) : 0;
            const itemUnitPrice = productPrice + variantModifier;
            const itemTotal = itemUnitPrice * item.quantity;
            const stock = item.variant ? item.variant.stock : item.product.stock;

            const imageUrl = item.product.images && item.product.images.length > 0 
              ? `http://localhost:8000/storage/${item.product.images[0].image_path}`
              : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop';

            return (
              <div
                key={item.id}
                className="glass-premium p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md hover:border-white/10 transition"
              >
                {/* Item Details */}
                <div className="flex items-center gap-4 w-full sm:w-1/2">
                  <div className="w-16 h-16 rounded-xl overflow-hidden glass border border-white/5 shrink-0">
                    <img src={imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <Link to={`/product/${item.product.slug}`} className="text-sm font-bold text-white hover:text-violet-400 transition line-clamp-1">
                      {item.product.name}
                    </Link>
                    {item.variant && (
                      <span className="text-[10px] bg-white/5 border border-white/5 text-gray-400 font-bold px-2 py-0.5 rounded-full inline-block mt-1">
                        {item.variant.name}: {item.variant.value}
                      </span>
                    )}
                    <span className="block text-[11px] text-gray-500 mt-1">${itemUnitPrice.toFixed(2)} each</span>
                  </div>
                </div>

                {/* Quantity Control & Total */}
                <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-1/2">
                  {/* Plus Minus */}
                  <div className="flex items-center glass rounded-xl border border-white/5 px-2 py-1 h-9">
                    <button
                      onClick={() => handleQtyChange(item.id, item.quantity, stock, false)}
                      className="p-0.5 text-gray-400 hover:text-white transition cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-white">{item.quantity}</span>
                    <button
                      onClick={() => handleQtyChange(item.id, item.quantity, stock, true)}
                      className="p-0.5 text-gray-400 hover:text-white transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-sm font-black text-white w-20 text-right">${itemTotal.toFixed(2)}</span>

                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-2 glass text-gray-400 hover:text-red-400 border border-white/5 rounded-xl transition cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Summary panel */}
        <div className="lg:w-1/3 flex flex-col gap-6">
          {/* Coupon Code Block */}
          <form onSubmit={applyCoupon} className="glass-premium p-6 rounded-2xl border border-white/5 shadow-md flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-violet-400" /> Apply Promo Code
            </h3>
            <div className="flex gap-2.5 mt-1">
              <input
                type="text"
                placeholder="Code (e.g. WELCOME10)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-grow glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
              />
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Apply
              </button>
            </div>
            {couponError && <span className="text-[10px] text-rose-400 font-bold">{couponError}</span>}
            {couponSuccess && <span className="text-[10px] text-emerald-400 font-bold">{couponSuccess}</span>}
          </form>

          {/* Checkout Totals Summary */}
          <div className="glass-premium p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col gap-4">
            <h3 className="text-sm font-black text-white border-b border-white/5 pb-3">Order Summary</h3>
            
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
              <span className="text-sm font-bold text-white">Order Total</span>
              <span className="text-xl font-black text-violet-400">${grandTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckoutRedirect}
              className="w-full mt-4 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-violet-600/10 hover:shadow-violet-600/25"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-center text-gray-500">Free shipping on orders of $150 or more</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
