import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, ShoppingCart } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/cartSlice';

function ProductCard({ product }) {
  const dispatch = useDispatch();

  const originalPrice = parseFloat(product.price);
  const discountPrice = product.discount_price ? parseFloat(product.discount_price) : null;
  const rating = parseFloat(product.rating || 0);

  const imageUrl = product.images && product.images.length > 0 
    ? `http://localhost:8000/storage/${product.images[0].image_path}`
    : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop'; // fallback beautiful sneaker image

  const handleQuickAdd = (e) => {
    e.preventDefault();
    dispatch(addToCart({
      product_id: product.id,
      quantity: 1,
    }));
  };

  return (
    <div className="glass-premium rounded-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-300 flex flex-col h-full shadow-lg hover:shadow-2xl hover:shadow-violet-600/5">
      {/* Product Image Wrapper */}
      <Link to={`/product/${product.slug}`} className="relative aspect-square overflow-hidden block">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-all duration-500"
        />
        
        {/* Featured Tag */}
        {product.is_featured && (
          <span className="absolute top-3.5 left-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg shadow-violet-600/30">
            Featured
          </span>
        )}

        {/* Discount Badge */}
        {discountPrice && (
          <span className="absolute top-3.5 right-3.5 bg-rose-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            {Math.round(((originalPrice - discountPrice) / originalPrice) * 100)}% OFF
          </span>
        )}

        {/* View Details Overlay */}
        <div className="absolute inset-0 bg-dark-300/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-xs">
          <span className="bg-white text-dark-200 text-xs font-bold px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            View Details <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-grow justify-between gap-4">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-violet-400 uppercase">
            <span>{product.category?.name || 'Catalog'}</span>
            <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full text-amber-400">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Title */}
          <Link to={`/product/${product.slug}`} className="block mt-2.5">
            <h3 className="text-gray-100 font-bold text-sm leading-snug group-hover:text-violet-400 transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {discountPrice ? (
              <>
                <span className="text-base font-extrabold text-white">${discountPrice.toFixed(2)}</span>
                <span className="text-xs text-gray-500 line-through mt-0.5">${originalPrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-base font-extrabold text-white">${originalPrice.toFixed(2)}</span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            className="p-2.5 rounded-full bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600 hover:text-white text-violet-400 transition cursor-pointer shadow-lg shadow-violet-600/5 hover:shadow-violet-600/25"
            title="Add to Cart"
          >
            <ShoppingCart className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
