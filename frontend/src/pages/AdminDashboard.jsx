import React, { useEffect, useState } from 'react';
import { LayoutDashboard, ShoppingBag, FolderTree, ClipboardList, Star, Users, Plus, Edit, Trash2, Check, X, ShieldAlert, BarChart3, Upload } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Stats States
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);

  // Catalog CRUD list states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [customers, setCustomers] = useState([]);

  // General Loading States
  const [loading, setLoading] = useState(true);

  // Forms Visibility States
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // CSV Bulk Upload state
  const [csvFile, setCsvFile] = useState(null);
  const [csvMsg, setCsvMsg] = useState('');

  // Product Form State
  const [productData, setProductData] = useState({
    category_id: '',
    brand_id: '',
    name: '',
    description: '',
    price: '',
    discount_price: '',
    stock: '',
    sku: '',
    is_featured: false,
    is_active: true,
  });
  const [productImages, setProductImages] = useState([]);
  const [productVariants, setProductVariants] = useState([]); // [{ name: 'Size', value: 'US 9', price_modifier: 0, stock: 10 }]
  const [productSpecs, setProductSpecs] = useState(''); // JSON string key-value: {"Display": "6.1-inch"}

  // Variant Form Input Helper State
  const [newVar, setNewVar] = useState({ name: 'Color', value: '', price_modifier: '0', stock: '0' });

  // Category Form State
  const [categoryData, setCategoryData] = useState({
    name: '',
    parent_id: '',
    description: '',
  });
  const [categoryImage, setCategoryImage] = useState(null);

  // Fetch Dashboard Stats & Lists
  const loadDashboardData = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.stats);
      setLowStock(res.data.low_stock);
      setRecentOrders(res.data.recent_orders);
      setChartData(res.data.sales_chart);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.get('/admin/products');
      setProducts(res.data);
    } catch (err) {}
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data);
    } catch (err) {}
  };

  const loadBrands = async () => {
    try {
      const res = await api.get('/admin/brands');
      setBrands(res.data);
    } catch (err) {}
  };

  const loadOrders = async () => {
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data.data);
    } catch (err) {}
  };

  const loadReviews = async () => {
    try {
      const res = await api.get('/admin/reviews');
      setReviews(res.data);
    } catch (err) {}
  };

  const loadCustomers = async () => {
    try {
      const res = await api.get('/admin/customers');
      setCustomers(res.data);
    } catch (err) {}
  };

  useEffect(() => {
    setLoading(true);
    const syncLists = async () => {
      if (activeTab === 'overview') {
        await loadDashboardData();
      } else if (activeTab === 'products') {
        await Promise.all([loadProducts(), loadCategories(), loadBrands()]);
      } else if (activeTab === 'categories') {
        await loadCategories();
      } else if (activeTab === 'orders') {
        await loadOrders();
      } else if (activeTab === 'reviews') {
        await loadReviews();
      } else if (activeTab === 'customers') {
        await loadCustomers();
      }
      setLoading(false);
    };
    syncLists();
  }, [activeTab]);

  // Product actions
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(productData).forEach(([key, val]) => {
      if (typeof val === 'boolean') {
        formData.append(key, val ? 1 : 0);
      } else {
        formData.append(key, val);
      }
    });

    if (productSpecs) {
      formData.append('specifications', productSpecs);
    }

    if (productVariants.length > 0) {
      formData.append('variants', JSON.stringify(productVariants));
    }

    if (productImages.length > 0) {
      for (let i = 0; i < productImages.length; i++) {
        formData.append('images[]', productImages[i]);
      }
    }

    try {
      if (editingProductId) {
        await api.post(`/admin/products/${editingProductId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/admin/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      loadProducts();
      setShowProductForm(false);
      setEditingProductId(null);
      resetProductFormState();
    } catch (err) {
      alert(err.response?.data?.message || 'Error occurred while saving product.');
    }
  };

  const handleEditProductClick = (p) => {
    setEditingProductId(p.id);
    setProductData({
      category_id: p.category_id,
      brand_id: p.brand_id || '',
      name: p.name,
      description: p.description || '',
      price: p.price,
      discount_price: p.discount_price || '',
      stock: p.stock,
      sku: p.sku,
      is_featured: p.is_featured,
      is_active: p.is_active,
    });
    setProductSpecs(p.specifications ? JSON.stringify(p.specifications) : '');
    setProductVariants(p.variants || []);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      loadProducts();
    } catch (err) {}
  };

  const handleAddVariant = () => {
    if (!newVar.value) return;
    setProductVariants([
      ...productVariants,
      {
        name: newVar.name,
        value: newVar.value,
        price_modifier: parseFloat(newVar.price_modifier || 0),
        stock: parseInt(newVar.stock || 0),
      },
    ]);
    setNewVar({ ...newVar, value: '', price_modifier: '0', stock: '0' });
  };

  const handleRemoveVariant = (index) => {
    setProductVariants(productVariants.filter((_, i) => i !== index));
  };

  const resetProductFormState = () => {
    setProductData({
      category_id: '',
      brand_id: '',
      name: '',
      description: '',
      price: '',
      discount_price: '',
      stock: '',
      sku: '',
      is_featured: false,
      is_active: true,
    });
    setProductImages([]);
    setProductVariants([]);
    setProductSpecs('');
  };

  // Bulk Product CSV Upload
  const handleBulkUploadSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    setCsvMsg('');

    const formData = new FormData();
    formData.append('csv_file', csvFile);

    try {
      const res = await api.post('/admin/products/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCsvMsg(res.data.message);
      setCsvFile(null);
      loadProducts();
    } catch (err) {
      setCsvMsg('Bulk upload failed.');
    }
  };

  // Category actions
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', categoryData.name);
    formData.append('description', categoryData.description);
    if (categoryData.parent_id) {
      formData.append('parent_id', categoryData.parent_id);
    }
    if (categoryImage) {
      formData.append('image', categoryImage);
    }

    try {
      if (editingCategoryId) {
        await api.post(`/admin/categories/${editingCategoryId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/admin/categories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      loadCategories();
      setShowCategoryForm(false);
      setEditingCategoryId(null);
      setCategoryData({ name: '', parent_id: '', description: '' });
      setCategoryImage(null);
    } catch (err) {}
  };

  const handleEditCategoryClick = (c) => {
    setEditingCategoryId(c.id);
    setCategoryData({
      name: c.name,
      parent_id: c.parent_id || '',
      description: c.description || '',
    });
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Subcategories will be orphaned or deleted.')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      loadCategories();
    } catch (err) {}
  };

  // Order status actions
  const handleOrderStatusChange = async (orderId, newStatus, currentPayStatus) => {
    let payStatus = currentPayStatus;
    if (newStatus === 'delivered') payStatus = 'paid';
    if (newStatus === 'cancelled') payStatus = 'refunded';

    try {
      await api.put(`/admin/orders/${orderId}/status`, {
        status: newStatus,
        payment_status: payStatus,
      });
      loadOrders();
    } catch (err) {}
  };

  // Review approval actions
  const handleApproveReview = async (id) => {
    try {
      await api.put(`/admin/reviews/${id}/approve`);
      loadReviews();
    } catch (err) {}
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete review?')) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      loadReviews();
    } catch (err) {}
  };

  // Customer status actions
  const handleToggleCustomerBlock = async (id) => {
    try {
      await api.put(`/admin/customers/${id}/toggle-status`);
      loadCustomers();
    } catch (err) {}
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Top dashboard header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-violet-500/10 text-violet-400 border border-violet-500/15 rounded-2xl">
          <LayoutDashboard className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Super Admin Console</h1>
          <p className="text-xs text-gray-400 mt-1">Manage storefront catalog, customer orders, reviews, and blocking</p>
        </div>
      </div>

      {/* Admin navigation tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-white/5 pb-2 scrollbar-thin">
        {[
          { id: 'overview', name: 'Overview', icon: BarChart3 },
          { id: 'products', name: 'Products', icon: ShoppingBag },
          { id: 'categories', name: 'Categories', icon: FolderTree },
          { id: 'orders', name: 'Orders', icon: ClipboardList },
          { id: 'reviews', name: 'Reviews Approval', icon: Star },
          { id: 'customers', name: 'Customers', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/10'
                  : 'glass text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.name}
            </button>
          );
        })}
      </div>

      {/* Main Admin Tab View */}
      <div>
        {/* TABS 1: Overview */}
        {activeTab === 'overview' && stats && (
          <div className="flex flex-col gap-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Revenue', val: `$${stats.total_sales}`, sub: 'Completed Sales' },
                { name: 'Total Orders', val: stats.total_orders, sub: `${stats.pending_orders} Pending` },
                { name: 'Total Customers', val: stats.total_customers, sub: 'Registered Users' },
                { name: 'Low Stock Items', val: lowStock.length, sub: 'Requires Attention' },
              ].map((kpi, idx) => (
                <div key={idx} className="glass-premium p-5 rounded-2xl border border-white/5 shadow-md">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{kpi.name}</span>
                  <h3 className="text-2xl font-black text-white mt-1.5">{kpi.val}</h3>
                  <span className="text-[10px] text-gray-400 block mt-1.5">{kpi.sub}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sales area chart using Recharts */}
              <div className="lg:col-span-2 glass-premium p-6 rounded-2xl border border-white/5 shadow-md flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">7-Day Sales Trend ($)</h3>
                <div className="w-full h-64 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: 10 }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#11131c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 11 }} />
                      <Area type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Low stock alerts */}
              <div className="glass-premium p-6 rounded-2xl border border-white/5 shadow-md flex flex-col gap-4 h-fit">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-rose-400 flex items-center gap-1">
                  <ShieldAlert className="w-4.5 h-4.5" /> Low Stock Alerts
                </h3>
                {lowStock.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4">All items fully stocked.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {lowStock.map((prod) => (
                      <div key={prod.id} className="flex justify-between items-center text-xs py-2 border-b border-white/5">
                        <span className="font-bold text-gray-300 truncate max-w-[150px]">{prod.name}</span>
                        <span className="font-black text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full">{prod.stock} left</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TABS 2: Products */}
        {activeTab === 'products' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Product Catalog</h2>
              {!showProductForm && (
                <button
                  onClick={() => { setEditingProductId(null); resetProductFormState(); setShowProductForm(true); }}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4.5 h-4.5" /> Add Product
                </button>
              )}
            </div>

            {/* Product form overlay/dialog */}
            {showProductForm && (
              <form onSubmit={handleProductSubmit} className="glass-premium p-6 rounded-2xl border border-white/5 flex flex-col gap-4 shadow-xl">
                <h3 className="text-sm font-bold text-white">{editingProductId ? 'Edit Product details' : 'Add New Product'}</h3>

                {/* Form fields grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Product Name</label>
                    <input
                      type="text"
                      required
                      value={productData.name}
                      onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                      className="glass-input px-3 py-2 rounded-xl text-xs text-gray-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">SKU Code</label>
                    <input
                      type="text"
                      required
                      value={productData.sku}
                      onChange={(e) => setProductData({ ...productData, sku: e.target.value })}
                      className="glass-input px-3 py-2 rounded-xl text-xs text-gray-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Category</label>
                    <select
                      required
                      value={productData.category_id}
                      onChange={(e) => setProductData({ ...productData, category_id: e.target.value })}
                      className="glass px-3 py-2 rounded-xl text-xs text-gray-300"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <React.Fragment key={cat.id}>
                          <option value={cat.id}>{cat.name}</option>
                          {cat.children && cat.children.map((sub) => (
                            <option key={sub.id} value={sub.id}>&nbsp;&nbsp;&bull; {sub.name}</option>
                          ))}
                        </React.Fragment>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Base Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productData.price}
                      onChange={(e) => setProductData({ ...productData, price: e.target.value })}
                      className="glass-input px-3 py-2 rounded-xl text-xs text-gray-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Discount Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productData.discount_price}
                      onChange={(e) => setProductData({ ...productData, discount_price: e.target.value })}
                      className="glass-input px-3 py-2 rounded-xl text-xs text-gray-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Global Stock</label>
                    <input
                      type="number"
                      required
                      value={productData.stock}
                      onChange={(e) => setProductData({ ...productData, stock: e.target.value })}
                      className="glass-input px-3 py-2 rounded-xl text-xs text-gray-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Brand</label>
                    <select
                      value={productData.brand_id}
                      onChange={(e) => setProductData({ ...productData, brand_id: e.target.value })}
                      className="glass px-3 py-2 rounded-xl text-xs text-gray-300"
                    >
                      <option value="">No Brand</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400">Description</label>
                  <textarea
                    rows={3}
                    value={productData.description}
                    onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                    className="glass-input p-3 rounded-xl text-xs text-gray-200 resize-none"
                  />
                </div>

                {/* Upload product images */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400">Upload Product Images</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setProductImages(e.target.files)}
                    className="text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-violet-600 file:text-white file:cursor-pointer"
                  />
                </div>

                {/* Specifications JSON string field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400">Technical Specs (JSON string format)</label>
                  <input
                    type="text"
                    placeholder='e.g. {"Display": "6.1 inch", "Camera": "48 MP"}'
                    value={productSpecs}
                    onChange={(e) => setProductSpecs(e.target.value)}
                    className="glass-input px-3 py-2 rounded-xl text-xs text-gray-200"
                  />
                </div>

                {/* Variants Manager builder inside form */}
                <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                  <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">Product Variants ({productVariants.length})</span>
                  
                  <div className="flex flex-wrap gap-2.5 max-h-32 overflow-y-auto mb-2">
                    {productVariants.map((v, i) => (
                      <div key={i} className="glass px-3 py-1.5 rounded-xl border border-white/5 text-[10px] flex items-center gap-2">
                        <span className="font-semibold">{v.name}:</span>
                        <span className="font-bold text-white">{v.value}</span>
                        {v.price_modifier > 0 && <span className="text-violet-400 font-bold">(+${v.price_modifier})</span>}
                        <span className="text-gray-500">| Qty: {v.stock}</span>
                        <button type="button" onClick={() => handleRemoveVariant(i)} className="text-red-400 hover:text-red-300 font-bold ml-1 cursor-pointer">×</button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-3 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-gray-500">Variant Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Size, Color"
                        value={newVar.name}
                        onChange={(e) => setNewVar({ ...newVar, name: e.target.value })}
                        className="glass-input px-3 py-1 rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-gray-500">Value</label>
                      <input
                        type="text"
                        placeholder="e.g. Red, 256GB"
                        value={newVar.value}
                        onChange={(e) => setNewVar({ ...newVar, value: e.target.value })}
                        className="glass-input px-3 py-1 rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-gray-500">Price Mod (+)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newVar.price_modifier}
                        onChange={(e) => setNewVar({ ...newVar, price_modifier: e.target.value })}
                        className="glass-input px-3 py-1 rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-gray-500">Variant Stock</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newVar.stock}
                        onChange={(e) => setNewVar({ ...newVar, stock: e.target.value })}
                        className="glass-input px-3 py-1 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="w-fit mt-1.5 glass hover:bg-white/5 border border-white/5 text-[10px] font-bold px-4 py-1.5 rounded-lg cursor-pointer text-gray-300"
                  >
                    Add Variant Option
                  </button>
                </div>

                {/* Checkbox settings features */}
                <div className="flex gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={productData.is_featured}
                      onChange={(e) => setProductData({ ...productData, is_featured: e.target.checked })}
                      className="rounded accent-violet-600 bg-white/5"
                    />
                    <label htmlFor="isFeatured" className="text-xs text-gray-300 cursor-pointer">Featured Product</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={productData.is_active}
                      onChange={(e) => setProductData({ ...productData, is_active: e.target.checked })}
                      className="rounded accent-violet-600 bg-white/5"
                    />
                    <label htmlFor="isActive" className="text-xs text-gray-300 cursor-pointer">Product Active (visible in shop)</label>
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => { setShowProductForm(false); setEditingProductId(null); resetProductFormState(); }}
                    className="glass px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-white/5 text-gray-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl cursor-pointer"
                  >
                    {editingProductId ? 'Save changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            )}

            {/* CSV Import card */}
            {!showProductForm && (
              <form onSubmit={handleBulkUploadSubmit} className="glass-premium p-6 rounded-2xl border border-white/5 shadow-md flex items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-violet-600/10 text-violet-400 border border-violet-500/20 rounded-xl">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Bulk Import Products</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Upload a CSV file with headers: CategoryId, BrandId, Name, Description, Price, Stock, SKU</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".csv"
                    required
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    className="text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-white/5 file:text-gray-300 file:cursor-pointer"
                  />
                  <button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    Import CSV
                  </button>
                </div>
                {csvMsg && <span className="text-[10px] font-bold text-violet-400 shrink-0 ml-4">{csvMsg}</span>}
              </form>
            )}

            {/* Products List Grid Table */}
            <div className="glass-premium rounded-2xl border border-white/5 overflow-x-auto shadow-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">
                    <th className="p-4 pl-6">Product details</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-300 divide-y divide-white/2">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-white/1 transition">
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden glass border border-white/5 shrink-0">
                          {p.images && p.images.length > 0 ? (
                            <img src={`http://localhost:8000/storage/${p.images[0].image_path}`} alt="thumb" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-violet-600/10 flex items-center justify-center font-bold text-violet-400">P</div>
                          )}
                        </div>
                        <div className="overflow-hidden max-w-[200px]">
                          <span className="font-bold text-white truncate block">{p.name}</span>
                          <span className="text-[10px] text-gray-500 mt-0.5 block truncate">{p.category?.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-gray-400">{p.sku}</td>
                      <td className="p-4 font-bold text-white">${parseFloat(p.discount_price || p.price).toFixed(2)}</td>
                      <td className={`p-4 font-semibold ${p.stock < 10 ? 'text-rose-400' : 'text-gray-400'}`}>{p.stock} units</td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-3.5">
                          <button
                            onClick={() => handleEditProductClick(p)}
                            className="text-gray-400 hover:text-violet-400 transition cursor-pointer"
                            title="Edit product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="text-gray-500 hover:text-red-400 transition cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABS 3: Categories */}
        {activeTab === 'categories' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Categories Management</h2>
              {!showCategoryForm && (
                <button
                  onClick={() => { setEditingCategoryId(null); setCategoryData({ name: '', parent_id: '', description: '' }); setShowCategoryForm(true); }}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4.5 h-4.5" /> Add Category
                </button>
              )}
            </div>

            {showCategoryForm && (
              <form onSubmit={handleCategorySubmit} className="glass-premium p-6 rounded-2xl border border-white/5 flex flex-col gap-4 shadow-xl">
                <h3 className="text-sm font-bold text-white">{editingCategoryId ? 'Edit Category Details' : 'Add New Category'}</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Category Name</label>
                    <input
                      type="text"
                      required
                      value={categoryData.name}
                      onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
                      className="glass-input px-3.5 py-2 rounded-xl text-xs text-gray-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Parent Category</label>
                    <select
                      value={categoryData.parent_id}
                      onChange={(e) => setCategoryData({ ...categoryData, parent_id: e.target.value })}
                      className="glass px-3 py-2 rounded-xl text-xs text-gray-300"
                    >
                      <option value="">None (Top-Level Category)</option>
                      {categories.filter((c) => !c.parent_id && c.id !== editingCategoryId).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400">Description</label>
                  <textarea
                    rows={2}
                    value={categoryData.description}
                    onChange={(e) => setCategoryData({ ...categoryData, description: e.target.value })}
                    className="glass-input p-3 rounded-xl text-xs text-gray-200 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400">Upload Banner Image</label>
                  <input
                    type="file"
                    onChange={(e) => setCategoryImage(e.target.files[0])}
                    className="text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-violet-600 file:text-white file:cursor-pointer"
                  />
                </div>

                <div className="flex gap-3 justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => { setShowCategoryForm(false); setEditingCategoryId(null); }}
                    className="glass px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-white/5 text-gray-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl cursor-pointer"
                  >
                    {editingCategoryId ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </form>
            )}

            {/* Categories Table List */}
            <div className="glass-premium rounded-2xl border border-white/5 overflow-x-auto shadow-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">
                    <th className="p-4 pl-6">Category Details</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Type</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-300 divide-y divide-white/2">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-white/1 transition">
                      <td className="p-4 pl-6 font-bold text-white flex items-center gap-3">
                        {c.image ? (
                          <img src={`http://localhost:8000/storage/${c.image}`} alt="cat" className="w-8 h-8 rounded-lg object-cover border border-white/5" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-violet-600/10 flex items-center justify-center font-bold text-violet-400">C</div>
                        )}
                        <span>{c.name}</span>
                      </td>
                      <td className="p-4 text-gray-400 max-w-xs truncate">{c.description || '-'}</td>
                      <td className="p-4 text-gray-400">
                        {c.parent_id ? (
                          <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">Sub-Category</span>
                        ) : (
                          <span className="text-[10px] bg-violet-600/20 text-violet-400 border border-violet-500/25 px-2 py-0.5 rounded-full font-bold">Top Level</span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-3.5">
                          <button
                            onClick={() => handleEditCategoryClick(c)}
                            className="text-gray-400 hover:text-violet-400 transition cursor-pointer"
                            title="Edit category"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(c.id)}
                            className="text-gray-500 hover:text-red-400 transition cursor-pointer"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABS 4: Orders */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white">Customer Orders Management</h2>

            <div className="glass-premium rounded-2xl border border-white/5 overflow-x-auto shadow-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">
                    <th className="p-4 pl-6">Order Number</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Change Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-300 divide-y divide-white/2">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-white/1 transition">
                      <td className="p-4 pl-6 font-mono text-[11px] font-extrabold text-white">{ord.order_number}</td>
                      <td className="p-4 text-gray-400">{new Date(ord.created_at).toLocaleDateString()}</td>
                      <td className="p-4 font-bold text-gray-200">{ord.user?.name || 'Guest checkout'}</td>
                      <td className="p-4 font-bold text-white">${parseFloat(ord.total).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ord.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                          ord.payment_status === 'refunded' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>{ord.payment_status}</span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ord.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                          ord.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-violet-500/10 text-violet-400'
                        }`}>{ord.status}</span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <select
                          value={ord.status}
                          onChange={(e) => handleOrderStatusChange(ord.id, e.target.value, ord.payment_status)}
                          className="glass px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-gray-300 cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="returned">Returned</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABS 5: Reviews */}
        {activeTab === 'reviews' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white">Product Reviews Approval</h2>

            <div className="glass-premium rounded-2xl border border-white/5 overflow-x-auto shadow-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">
                    <th className="p-4 pl-6">Customer</th>
                    <th className="p-4">Product</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Comment</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-300 divide-y divide-white/2">
                  {reviews.map((rev) => (
                    <tr key={rev.id} className="hover:bg-white/1 transition">
                      <td className="p-4 pl-6 font-bold text-gray-200">{rev.user?.name}</td>
                      <td className="p-4 text-violet-400 font-semibold">{rev.product?.name}</td>
                      <td className="p-4 font-bold text-amber-400">★ {rev.rating}</td>
                      <td className="p-4 text-gray-400 max-w-xs truncate">{rev.comment}</td>
                      <td className="p-4">
                        {rev.is_approved ? (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">Approved</span>
                        ) : (
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">Pending Approval</span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-3.5">
                          {!rev.is_approved && (
                            <button
                              onClick={() => handleApproveReview(rev.id)}
                              className="text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                              title="Approve review"
                            >
                              <Check className="w-4.5 h-4.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="text-gray-500 hover:text-red-400 transition cursor-pointer"
                            title="Delete review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABS 6: Customers */}
        {activeTab === 'customers' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white">Registered Customers</h2>

            <div className="glass-premium rounded-2xl border border-white/5 overflow-x-auto shadow-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">
                    <th className="p-4 pl-6">Customer details</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Orders count</th>
                    <th className="p-4">Account status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-300 divide-y divide-white/2">
                  {customers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-white/1 transition">
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/20 flex items-center justify-center font-bold text-violet-300">
                          {cust.name[0].toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <span className="font-bold text-white block">{cust.name}</span>
                          <span className="text-[10px] text-gray-500 block">{cust.email}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400">{cust.phone || '-'}</td>
                      <td className="p-4 font-extrabold text-white">{cust.orders_count} orders</td>
                      <td className="p-4">
                        {cust.is_active ? (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">Active</span>
                        ) : (
                          <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold">Blocked</span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => handleToggleCustomerBlock(cust.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition ${
                            cust.is_active
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                          }`}
                        >
                          {cust.is_active ? 'Block' : 'Unblock'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
