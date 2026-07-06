import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Headphones, Sparkles } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products/featured'),
          api.get('/categories')
        ]);
        setFeaturedProducts(prodRes.data);
        setCategories(catRes.data);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-16">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-3xl glass-premium py-16 md:py-24 px-8 md:px-16 flex flex-col md:flex-row items-center justify-between gap-12 shadow-2xl border border-white/10">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square bg-violet-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] aspect-square bg-pink-500/10 blur-[150px] rounded-full" />

        <div className="flex flex-col gap-6 md:w-1/2 z-10">
          <div className="inline-flex items-center gap-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-bold tracking-wider px-3.5 py-1.5 rounded-full uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Introducing E-Sphere 2.0
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.08] text-white">
            Next-Gen Tech & <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
              Elevated Style
            </span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-md leading-relaxed">
            Explore curated smart devices, activewear, and premium audio. Handpicked collections crafted to redefine your everyday life.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Link
              to="/catalog"
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm px-6 py-3 rounded-full flex items-center gap-2 shadow-lg shadow-violet-600/20 hover:shadow-violet-600/35 transition cursor-pointer"
            >
              Shop Collection <ArrowRight className="w-4.5 h-4.5" />
            </Link>
            <Link
              to="/catalog?sort=rating"
              className="glass hover:bg-white/5 text-gray-200 font-bold text-sm px-6 py-3 rounded-full transition cursor-pointer"
            >
              Top Rated
            </Link>
          </div>
        </div>

        {/* Right side banner image mock */}
        <div className="md:w-1/2 relative flex justify-center z-10">
          <div className="relative w-72 md:w-96 aspect-square rounded-2xl overflow-hidden glass shadow-2xl border border-white/10 group">
            <img
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop"
              alt="featured headphone hero"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-5 left-5 right-5 glass p-4 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Trending Item</span>
              <h4 className="text-sm font-bold text-white mt-1">Sony Noise Cancelling Pro</h4>
              <div className="flex justify-between items-center mt-2.5">
                <span className="text-sm font-black text-white">$299.00</span>
                <Link to="/product/sony-wh-1000xm4-wireless-headphones" className="text-xs font-semibold text-violet-300 flex items-center gap-1">
                  Buy Now <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">Popular Categories</h2>
            <p className="text-xs text-gray-400 mt-1">Browse through our curated departments</p>
          </div>
          <Link to="/catalog" className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1.5 transition">
            See All Categories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-video glass rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/catalog?category=${cat.slug}`}
                className="relative overflow-hidden rounded-2xl glass-premium aspect-[1.6] group border border-white/5 hover:border-violet-500/20 hover:scale-[1.02] transition-all duration-300 shadow-md"
              >
                {/* Image background mock */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-300 via-dark-300/40 to-transparent z-10" />
                <img
                  src={
                    cat.slug === 'smartphones'
                      ? 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&auto=format&fit=crop'
                      : cat.slug === 'audio-headphones'
                      ? 'https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=400&auto=format&fit=crop'
                      : cat.slug === 'shoes'
                      ? 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=400&auto=format&fit=crop'
                      : 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=400&auto=format&fit=crop'
                  }
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Title */}
                <div className="absolute bottom-4 left-4 z-20">
                  <h3 className="text-white font-extrabold text-sm md:text-base tracking-wide">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] text-gray-300 group-hover:text-violet-300 transition-colors mt-1 font-semibold flex items-center gap-1">
                    Explore <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products Section */}
      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-black text-white">Featured Products</h2>
          <p className="text-xs text-gray-400 mt-1">Handpicked deals and trending items</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square glass rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Benefits Badges Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-y border-white/5">
        <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/2 transition">
          <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/15">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-200">Free Worldwide Delivery</h4>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">Free standard shipping on all orders over $150. Tracked shipping with custom duty paid.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/2 transition">
          <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/15">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-200">Secured Payments</h4>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">Your transaction details are fully encrypted. We accept cards, UPI, PayPal, and Cash on Delivery.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/2 transition">
          <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/15">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-200">24/7 Dedicated Support</h4>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">Got questions? Our support tickets are answered within hours. Real humans ready to help.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
