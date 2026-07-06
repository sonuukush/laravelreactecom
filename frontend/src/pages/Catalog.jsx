import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, RotateCcw, Filter, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';

function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();

  // API Lists
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // States
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filter States
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [brandFilters, setBrandFilters] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  // Mobile layout state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch initial categories & brands
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands')
        ]);
        setCategories(catRes.data);
        setBrands(brandRes.data);
      } catch (err) {
        console.error('Error fetching catalog metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Update filters if query params change (e.g. search from navbar)
  useEffect(() => {
    const searchParam = searchParams.get('search') || '';
    const catParam = searchParams.get('category') || '';
    setSearchVal(searchParam);
    setCategoryFilter(catParam);
    setCurrentPage(1);
  }, [searchParams]);

  // Fetch Products based on all state filters
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        search: searchVal,
        category: categoryFilter,
        min_price: minPrice,
        max_price: maxPrice,
        rating: ratingFilter,
        sort: sortOption,
      };

      if (brandFilters.length > 0) {
        params.brand = brandFilters.join(',');
      }

      const response = await api.get('/products', { params });
      setProducts(response.data.data);
      setTotalPages(response.data.last_page);
      setTotalProducts(response.data.total);
    } catch (err) {
      console.error('Error fetching filtered products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, categoryFilter, brandFilters, ratingFilter, sortOption]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleBrandChange = (slug) => {
    if (brandFilters.includes(slug)) {
      setBrandFilters(brandFilters.filter((b) => b !== slug));
    } else {
      setBrandFilters([...brandFilters, slug]);
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchVal('');
    setCategoryFilter('');
    setBrandFilters([]);
    setMinPrice('');
    setMaxPrice('');
    setRatingFilter('');
    setSortOption('newest');
    setCurrentPage(1);
    setSearchParams({});
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Catalog</h1>
          <p className="text-xs text-gray-400 mt-1">Found {totalProducts} premium products</p>
        </div>

        {/* Search & Mobile Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-grow md:w-72">
            <input
              type="text"
              placeholder="Search in catalog..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full glass-input px-4 py-2 pl-10 rounded-full text-xs text-gray-200"
            />
            <Search className="absolute left-3.5 text-gray-400 w-3.5 h-3.5" />
          </form>

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden flex items-center gap-1.5 glass text-xs font-bold px-4 py-2 rounded-full cursor-pointer hover:bg-white/5 text-gray-300"
          >
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>

          <select
            value={sortOption}
            onChange={(e) => {
              setSortOption(e.target.value);
              setCurrentPage(1);
            }}
            className="glass px-4 py-2 rounded-full text-xs font-bold text-gray-300 focus:outline-none cursor-pointer"
          >
            <option value="newest">Sort by: Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden md:flex flex-col gap-6 w-64 shrink-0 glass-premium p-6 rounded-2xl border border-white/5 h-fit">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <span className="text-sm font-black text-white">Filters</span>
            <button onClick={resetFilters} className="text-gray-400 hover:text-violet-400 transition flex items-center gap-1 text-[10px] font-bold uppercase cursor-pointer">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider mb-3">Categories</h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setCategoryFilter('')}
                className={`text-left text-xs py-1 transition font-medium ${categoryFilter === '' ? 'text-violet-400 font-bold' : 'text-gray-300 hover:text-white'}`}
              >
                All Departments
              </button>
              {categories.map((cat) => (
                <div key={cat.id} className="flex flex-col gap-1.5 pl-1.5">
                  <button
                    onClick={() => setCategoryFilter(cat.slug)}
                    className={`text-left text-xs py-0.5 transition font-semibold ${categoryFilter === cat.slug ? 'text-violet-400 font-bold' : 'text-gray-300 hover:text-white'}`}
                  >
                    {cat.name}
                  </button>
                  {cat.children && cat.children.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setCategoryFilter(sub.slug)}
                      className={`text-left text-[11px] pl-3 py-0.5 transition ${categoryFilter === sub.slug ? 'text-violet-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div>
            <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider mb-3">Brands</h4>
            <div className="flex flex-col gap-2.5">
              {brands.map((b) => (
                <label key={b.id} className="flex items-center gap-2.5 text-xs text-gray-300 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={brandFilters.includes(b.slug)}
                    onChange={() => handleBrandChange(b.slug)}
                    className="rounded accent-violet-600 bg-white/5 border-white/10"
                  />
                  <span>{b.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider mb-3">Price Range ($)</h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-1/2 glass-input px-3 py-1.5 rounded-lg text-xs"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-1/2 glass-input px-3 py-1.5 rounded-lg text-xs"
              />
            </div>
            <button
              onClick={() => { setCurrentPage(1); fetchProducts(); }}
              className="w-full mt-3 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold py-2 rounded-lg transition cursor-pointer"
            >
              Apply Price
            </button>
          </div>

          {/* Rating */}
          <div>
            <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider mb-3">Rating</h4>
            <div className="flex flex-col gap-2">
              {[4, 3, 2].map((stars) => (
                <button
                  key={stars}
                  onClick={() => setRatingFilter(stars.toString())}
                  className={`flex items-center gap-2 text-xs transition ${ratingFilter === stars.toString() ? 'text-violet-400 font-bold' : 'text-gray-400 hover:text-white'}`}
                >
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < stars ? 'fill-amber-400' : 'text-gray-600'}`} />
                    ))}
                  </div>
                  <span>& Up</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid / Listings */}
        <div className="flex-grow flex flex-col gap-8">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square glass rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="glass-premium rounded-2xl p-16 text-center flex flex-col items-center justify-center border border-white/5">
              <span className="text-4xl">🔎</span>
              <h3 className="text-lg font-bold text-white mt-4">No Products Found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">We couldn't find any products matching your active filters. Try clearing them to start over.</p>
              <button
                onClick={resetFilters}
                className="mt-6 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-6 py-2.5 rounded-full transition cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4 border-t border-white/5 pt-6">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="p-2 glass rounded-full hover:bg-white/5 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronLeft className="w-4.5 h-4.5" />
                  </button>

                  <div className="flex gap-1.5">
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNum = index + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-full transition cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-violet-600 text-white'
                              : 'glass text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="p-2 glass rounded-full hover:bg-white/5 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronRight className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden bg-dark-300/80 backdrop-blur-sm animate-fade-in">
          <div className="w-80 h-full glass-premium p-6 flex flex-col gap-6 overflow-y-auto border-l border-white/5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm font-black text-white">Filters</span>
              <div className="flex items-center gap-4">
                <button onClick={resetFilters} className="text-gray-400 hover:text-violet-400 transition flex items-center gap-1 text-[10px] font-bold uppercase cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <button onClick={() => setShowMobileFilters(false)} className="text-sm font-bold text-gray-300 hover:text-white cursor-pointer">
                  Close
                </button>
              </div>
            </div>

            {/* Sidebar content copy */}
            {/* Categories */}
            <div>
              <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider mb-3">Categories</h4>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setCategoryFilter(''); setShowMobileFilters(false); }}
                  className={`text-left text-xs py-1 transition ${categoryFilter === '' ? 'text-violet-400 font-bold' : 'text-gray-300 hover:text-white'}`}
                >
                  All Departments
                </button>
                {categories.map((cat) => (
                  <div key={cat.id} className="flex flex-col gap-1.5 pl-1.5">
                    <button
                      onClick={() => { setCategoryFilter(cat.slug); setShowMobileFilters(false); }}
                      className={`text-left text-xs py-0.5 transition ${categoryFilter === cat.slug ? 'text-violet-400 font-bold' : 'text-gray-300 hover:text-white'}`}
                    >
                      {cat.name}
                    </button>
                    {cat.children && cat.children.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => { setCategoryFilter(sub.slug); setShowMobileFilters(false); }}
                        className={`text-left text-[11px] pl-3 py-0.5 transition ${categoryFilter === sub.slug ? 'text-violet-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div>
              <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider mb-3">Brands</h4>
              <div className="flex flex-col gap-2.5">
                {brands.map((b) => (
                  <label key={b.id} className="flex items-center gap-2.5 text-xs text-gray-300 hover:text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={brandFilters.includes(b.slug)}
                      onChange={() => handleBrandChange(b.slug)}
                      className="rounded accent-violet-600 bg-white/5 border-white/10"
                    />
                    <span>{b.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider mb-3">Price Range ($)</h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 glass-input px-3 py-1.5 rounded-lg text-xs"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 glass-input px-3 py-1.5 rounded-lg text-xs"
                />
              </div>
              <button
                onClick={() => { setCurrentPage(1); fetchProducts(); setShowMobileFilters(false); }}
                className="w-full mt-3 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold py-2 rounded-lg transition cursor-pointer"
              >
                Apply Price
              </button>
            </div>

            {/* Rating */}
            <div>
              <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider mb-3">Rating</h4>
              <div className="flex flex-col gap-2">
                {[4, 3, 2].map((stars) => (
                  <button
                    key={stars}
                    onClick={() => { setRatingFilter(stars.toString()); setShowMobileFilters(false); }}
                    className={`flex items-center gap-2 text-xs transition ${ratingFilter === stars.toString() ? 'text-violet-400 font-bold' : 'text-gray-400 hover:text-white'}`}
                  >
                    <div className="flex gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < stars ? 'fill-amber-400' : 'text-gray-600'}`} />
                      ))}
                    </div>
                    <span>& Up</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Catalog;
