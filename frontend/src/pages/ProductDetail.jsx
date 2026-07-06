import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Star, ShoppingCart, Heart, Plus, Minus, ShieldCheck, Check } from 'lucide-react';
import api from '../utils/api';
import { addToCart } from '../store/cartSlice';
import ProductCard from '../components/ProductCard';

function ProductDetail() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // API States
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection States
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({}); // { Color: 'Black', Storage: '256GB' }
  const [priceModifier, setPriceModifier] = useState(0);

  // Review Form States
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/products/${slug}`);
        setProduct(response.data.product);
        setReviews(response.data.reviews);
        setRelated(response.data.related);
        
        // Setup initial variant selections
        const variants = response.data.product.variants || [];
        const initialSelections = {};
        variants.forEach((v) => {
          if (!initialSelections[v.name]) {
            initialSelections[v.name] = v.value;
          }
        });
        setSelectedVariants(initialSelections);
        setActiveImage(0);
        setQuantity(1);
      } catch (err) {
        console.error('Error fetching product detail page:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [slug]);

  // Calculate Price Modifier when variant selections change
  useEffect(() => {
    if (!product || !product.variants) return;
    
    let modifier = 0;
    // For each selection, find the variant with that name and value
    Object.entries(selectedVariants).forEach(([varName, varValue]) => {
      const match = product.variants.find(
        (v) => v.name === varName && v.value === varValue
      );
      if (match) {
        modifier += parseFloat(match.price_modifier || 0);
      }
    });
    setPriceModifier(modifier);
  }, [selectedVariants, product]);

  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/2 aspect-square glass rounded-3xl" />
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <div className="h-6 w-32 glass rounded-full" />
            <div className="h-10 w-3/4 glass rounded-xl" />
            <div className="h-6 w-24 glass rounded-full" />
            <div className="h-24 w-full glass rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-24 glass rounded-2xl">
        <h2 className="text-xl font-bold text-white">Product Not Found</h2>
        <Link to="/catalog" className="text-violet-400 mt-4 inline-block font-bold">Return to shop</Link>
      </div>
    );
  }

  // Price calculations
  const basePrice = parseFloat(product.price);
  const discountPrice = product.discount_price ? parseFloat(product.discount_price) : null;
  const currentBasePrice = discountPrice ? discountPrice : basePrice;
  const finalUnitPrice = currentBasePrice + priceModifier;

  // Variants list grouping
  const groupedVariants = {};
  if (product.variants) {
    product.variants.forEach((v) => {
      if (!groupedVariants[v.name]) {
        groupedVariants[v.name] = [];
      }
      if (!groupedVariants[v.name].includes(v.value)) {
        groupedVariants[v.name].push(v.value);
      }
    });
  }

  const handleAddToCart = () => {
    // Look up active variant if relevant
    let variantId = null;
    if (product.variants && product.variants.length > 0) {
      // Find a variant that matches all selections (this is simplified; typically variant represents a distinct SKU. We'll find any matching variant)
      const matchingVariant = product.variants.find((v) => {
        return Object.entries(selectedVariants).every(([name, value]) => {
          return v.name === name && v.value === value;
        });
      });
      if (matchingVariant) {
        variantId = matchingVariant.id;
      }
    }

    dispatch(addToCart({
      product_id: product.id,
      variant_id: variantId,
      quantity,
    }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewMsg('');
    setReviewError('');
    setSubmittingReview(true);

    try {
      const res = await api.post(`/products/${product.id}/reviews`, {
        rating: userRating,
        comment: userComment,
      });
      setReviewMsg(res.data.message);
      setUserComment('');
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const productImages = product.images && product.images.length > 0 
    ? product.images.map((img) => `http://localhost:8000/storage/${img.image_path}`)
    : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop'];

  return (
    <div className="flex flex-col gap-16">
      {/* Product Top Detail Row */}
      <section className="flex flex-col md:flex-row gap-12">
        {/* Left Side: Images Gallery */}
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <div className="aspect-square rounded-3xl overflow-hidden glass border border-white/5 relative shadow-xl">
            <img
              src={productImages[activeImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails */}
          {productImages.length > 1 && (
            <div className="flex gap-4">
              {productImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-20 aspect-square rounded-xl overflow-hidden glass border cursor-pointer transition ${
                    activeImage === i ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Info Panel */}
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-3 text-xs font-semibold tracking-wider text-violet-400 uppercase">
              <span>{product.brand?.name || 'Generic'}</span>
              <span>&bull;</span>
              <span>{product.category?.name}</span>
            </div>
            <h1 className="text-3xl font-black text-white mt-2 leading-snug">{product.name}</h1>
            
            {/* Rating Stars Row */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating || 0) ? 'fill-amber-400' : 'text-gray-600'}`} />
                ))}
              </div>
              <span className="text-xs text-gray-400 font-medium">({reviews.length} Customer Reviews)</span>
            </div>
          </div>

          {/* Price Row */}
          <div className="flex items-baseline gap-4 border-y border-white/5 py-4">
            <span className="text-3xl font-black text-white">${finalUnitPrice.toFixed(2)}</span>
            {discountPrice && (
              <span className="text-sm text-gray-500 line-through">${(basePrice + priceModifier).toFixed(2)}</span>
            )}
          </div>

          <p className="text-gray-400 text-sm leading-relaxed">{product.description}</p>

          {/* Dynamic Variant Selectors */}
          {Object.keys(groupedVariants).map((varName) => (
            <div key={varName} className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{varName}</span>
              <div className="flex flex-wrap gap-2.5">
                {groupedVariants[varName].map((varValue) => (
                  <button
                    key={varValue}
                    onClick={() => setSelectedVariants({ ...selectedVariants, [varName]: varValue })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      selectedVariants[varName] === varValue
                        ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/10'
                        : 'glass border-white/5 text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {varValue}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity and Actions */}
          <div className="flex flex-col gap-4 mt-4">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Quantity</span>
            <div className="flex items-center gap-4">
              {/* Quantity Selector */}
              <div className="flex items-center glass rounded-xl border border-white/5 px-2 py-1.5 h-11">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-bold text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className="flex-grow bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm h-11 px-6 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-violet-600/10 hover:shadow-violet-600/25"
              >
                <ShoppingCart className="w-4.5 h-4.5" /> Add to Cart
              </button>

              <button className="p-3 glass hover:bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-pink-500 transition cursor-pointer h-11">
                <Heart className="w-5 h-5" />
              </button>
            </div>

            {/* Inventory Stock details */}
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>In stock & ready to ship (sku: {product.sku})</span>
            </div>
          </div>
        </div>
      </section>

      {/* Specifications Grid */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-white">Technical Specifications</h2>
          <div className="glass-premium rounded-2xl p-6 border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            {Object.entries(product.specifications).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center py-2.5 border-b border-white/5 text-xs">
                <span className="font-semibold text-gray-400">{key}</span>
                <span className="font-bold text-white text-right">{val}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews & Submission */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Reviews List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-white">Customer Reviews ({reviews.length})</h2>
          
          {reviews.length === 0 ? (
            <div className="glass-premium p-8 rounded-2xl text-center text-gray-400 text-xs border border-white/5">
              No reviews available for this product yet. Be the first to submit a review!
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="glass-premium p-5 rounded-2xl border border-white/5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center border border-violet-500/20 text-xs font-bold text-violet-300">
                        {rev.user?.name[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{rev.user?.name}</h4>
                        <span className="text-[10px] text-gray-500 font-medium">{new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-gray-700'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed pl-11">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Review Panel */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-white">Write a Review</h2>
          {isAuthenticated ? (
            <form onSubmit={handleReviewSubmit} className="glass-premium p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
              {reviewMsg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-medium">{reviewMsg}</div>}
              {reviewError && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium">{reviewError}</div>}

              {/* Rating picker */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-300">Rating</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setUserRating(stars)}
                      className="p-1 cursor-pointer transition text-amber-400"
                    >
                      <Star className={`w-6 h-6 ${stars <= userRating ? 'fill-amber-400' : 'text-gray-700'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text area */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-300">Comment</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share details of your experience with this product..."
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  className="w-full glass-input p-3.5 rounded-xl text-xs text-gray-200 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <div className="glass-premium p-6 rounded-2xl border border-white/5 text-center text-xs flex flex-col gap-4">
              <p className="text-gray-400 font-medium">You must be logged in to submit reviews for products.</p>
              <Link to="/login" className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl transition">
                Sign In to Review
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Related Products Grid */}
      {related.length > 0 && (
        <section className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold text-white">Related Products</h2>
            <p className="text-xs text-gray-400 mt-1">Frequently bought together with this category</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ProductDetail;
