<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Order;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    // --- Dashboard Stats ---
    public function dashboardStats()
    {
        $totalSales = Order::whereIn('status', ['processing', 'shipped', 'delivered'])->sum('total');
        $totalOrders = Order::count();
        $pendingOrders = Order::where('status', 'pending')->count();
        $totalCustomers = User::role('customer')->count();

        $lowStockAlerts = Product::where('stock', '<', 10)
            ->orWhereHas('variants', function ($q) {
                $q->where('stock', '<', 10);
            })
            ->with('images')
            ->limit(5)
            ->get();

        $recentOrders = Order::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // 7-day Sales Chart
        $salesData = Order::whereIn('status', ['processing', 'shipped', 'delivered'])
            ->where('created_at', '>=', now()->subDays(7))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as sales'),
                DB::raw('COUNT(id) as count')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return response()->json([
            'stats' => [
                'total_sales' => round($totalSales, 2),
                'total_orders' => $totalOrders,
                'pending_orders' => $pendingOrders,
                'total_customers' => $totalCustomers,
            ],
            'low_stock' => $lowStockAlerts,
            'recent_orders' => $recentOrders,
            'sales_chart' => $salesData,
        ]);
    }

    // --- Category CRUD ---
    public function categoriesIndex()
    {
        return response()->json(Category::with('children')->get());
    }

    public function categoriesStore(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $slug = Str::slug($request->name);
        // Ensure slug is unique
        $originalSlug = $slug;
        $count = 1;
        while (Category::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count++;
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('categories', 'public');
        }

        $category = Category::create([
            'name' => $request->name,
            'parent_id' => $request->parent_id,
            'slug' => $slug,
            'description' => $request->description,
            'image' => $imagePath,
        ]);

        return response()->json(['message' => 'Category created successfully.', 'category' => $category], 201);
    }

    public function categoriesUpdate(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $data = $request->only(['name', 'parent_id', 'description']);

        if ($request->name !== $category->name) {
            $slug = Str::slug($request->name);
            $originalSlug = $slug;
            $count = 1;
            while (Category::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $originalSlug . '-' . $count++;
            }
            $data['slug'] = $slug;
        }

        if ($request->hasFile('image')) {
            if ($category->image) {
                Storage::disk('public')->delete($category->image);
            }
            $data['image'] = $request->file('image')->store('categories', 'public');
        }

        $category->update($data);

        return response()->json(['message' => 'Category updated successfully.', 'category' => $category]);
    }

    public function categoriesDestroy($id)
    {
        $category = Category::findOrFail($id);
        if ($category->image) {
            Storage::disk('public')->delete($category->image);
        }
        $category->delete();

        return response()->json(['message' => 'Category deleted successfully.']);
    }

    // --- Brand CRUD ---
    public function brandsIndex()
    {
        return response()->json(Brand::all());
    }

    public function brandsStore(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $slug = Str::slug($request->name);
        $originalSlug = $slug;
        $count = 1;
        while (Brand::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count++;
        }

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('brands', 'public');
        }

        $brand = Brand::create([
            'name' => $request->name,
            'slug' => $slug,
            'logo' => $logoPath,
        ]);

        return response()->json(['message' => 'Brand created successfully.', 'brand' => $brand], 201);
    }

    public function brandsUpdate(Request $request, $id)
    {
        $brand = Brand::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $data = ['name' => $request->name];

        if ($request->name !== $brand->name) {
            $slug = Str::slug($request->name);
            $originalSlug = $slug;
            $count = 1;
            while (Brand::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $originalSlug . '-' . $count++;
            }
            $data['slug'] = $slug;
        }

        if ($request->hasFile('logo')) {
            if ($brand->logo) {
                Storage::disk('public')->delete($brand->logo);
            }
            $data['logo'] = $request->file('logo')->store('brands', 'public');
        }

        $brand->update($data);

        return response()->json(['message' => 'Brand updated successfully.', 'brand' => $brand]);
    }

    public function brandsDestroy($id)
    {
        $brand = Brand::findOrFail($id);
        if ($brand->logo) {
            Storage::disk('public')->delete($brand->logo);
        }
        $brand->delete();

        return response()->json(['message' => 'Brand deleted successfully.']);
    }

    // --- Product CRUD ---
    public function productsIndex()
    {
        return response()->json(Product::with(['category', 'brand', 'images', 'variants'])->get());
    }

    public function productsStore(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'specifications' => 'nullable|string', // JSON string from client
            'price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'sku' => 'required|string|unique:products,sku',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $slug = Str::slug($request->name);
        $originalSlug = $slug;
        $count = 1;
        while (Product::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count++;
        }

        $specs = null;
        if ($request->filled('specifications')) {
            $specs = json_decode($request->specifications, true);
        }

        $product = Product::create([
            'category_id' => $request->category_id,
            'brand_id' => $request->brand_id,
            'name' => $request->name,
            'slug' => $slug,
            'description' => $request->description,
            'specifications' => $specs,
            'price' => $request->price,
            'discount_price' => $request->discount_price,
            'stock' => $request->stock,
            'sku' => $request->sku,
            'is_featured' => $request->is_featured ?? false,
            'is_active' => $request->is_active ?? true,
        ]);

        // Process images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $imageFile) {
                $path = $imageFile->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => $path,
                ]);
            }
        }

        // Process variants (if provided as JSON string)
        if ($request->filled('variants')) {
            $variants = json_decode($request->variants, true);
            if (is_array($variants)) {
                foreach ($variants as $v) {
                    ProductVariant::create([
                        'product_id' => $product->id,
                        'name' => $v['name'],
                        'value' => $v['value'],
                        'price_modifier' => $v['price_modifier'] ?? 0,
                        'stock' => $v['stock'] ?? 0,
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Product created successfully.',
            'product' => $product->load(['images', 'variants'])
        ], 201);
    }

    public function productsUpdate(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'specifications' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'sku' => 'required|string|unique:products,sku,' . $product->id,
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $data = $request->only([
            'category_id', 'brand_id', 'name', 'description', 'price', 'discount_price', 'stock', 'sku', 'is_featured', 'is_active'
        ]);

        if ($request->filled('specifications')) {
            $data['specifications'] = json_decode($request->specifications, true);
        }

        if ($request->name !== $product->name) {
            $slug = Str::slug($request->name);
            $originalSlug = $slug;
            $count = 1;
            while (Product::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $originalSlug . '-' . $count++;
            }
            $data['slug'] = $slug;
        }

        $product->update($data);

        // Upload new images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $imageFile) {
                $path = $imageFile->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => $path,
                ]);
            }
        }

        // Handle variant updates (replace variants)
        if ($request->filled('variants')) {
            $variants = json_decode($request->variants, true);
            if (is_array($variants)) {
                $product->variants()->delete();
                foreach ($variants as $v) {
                    ProductVariant::create([
                        'product_id' => $product->id,
                        'name' => $v['name'],
                        'value' => $v['value'],
                        'price_modifier' => $v['price_modifier'] ?? 0,
                        'stock' => $v['stock'] ?? 0,
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Product updated successfully.',
            'product' => $product->load(['images', 'variants'])
        ]);
    }

    public function productsDestroy($id)
    {
        $product = Product::findOrFail($id);
        // Delete images from disk
        foreach ($product->images as $img) {
            Storage::disk('public')->delete($img->image_path);
        }
        $product->delete(); // Cascades to variants & images in DB

        return response()->json(['message' => 'Product deleted successfully.']);
    }

    public function deleteProductImage($id)
    {
        $img = ProductImage::findOrFail($id);
        Storage::disk('public')->delete($img->image_path);
        $img->delete();

        return response()->json(['message' => 'Product image deleted.']);
    }

    // --- Order Management ---
    public function ordersIndex(Request $request)
    {
        $query = Order::with(['user', 'address']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate(15);
        return response()->json($orders);
    }

    public function ordersShow($id)
    {
        $order = Order::with(['user', 'address', 'items.product.images', 'items.variant'])->findOrFail($id);
        return response()->json($order);
    }

    public function ordersUpdateStatus(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $request->validate([
            'status' => 'required|in:pending,processing,shipped,delivered,cancelled,returned',
            'payment_status' => 'required|in:unpaid,paid,failed,refunded',
        ]);

        $order->update([
            'status' => $request->status,
            'payment_status' => $request->payment_status,
        ]);

        return response()->json([
            'message' => 'Order status updated successfully.',
            'order' => $order,
        ]);
    }

    // --- Reviews Management ---
    public function reviewsIndex()
    {
        $reviews = Review::with(['user:id,name', 'product:id,name'])->orderBy('created_at', 'desc')->get();
        return response()->json($reviews);
    }

    public function reviewsApprove($id)
    {
        $review = Review::findOrFail($id);
        $review->update(['is_approved' => true]);

        // Re-calculate product rating
        $product = Product::find($review->product_id);
        if ($product) {
            $avgRating = Review::where('product_id', $product->id)->where('is_approved', true)->avg('rating');
            $product->update(['rating' => round($avgRating, 2)]);
        }

        return response()->json(['message' => 'Review approved successfully.', 'review' => $review]);
    }

    public function reviewsDestroy($id)
    {
        $review = Review::findOrFail($id);
        $review->delete();

        return response()->json(['message' => 'Review deleted.']);
    }

    // --- Customer Management ---
    public function customersIndex()
    {
        $customers = User::role('customer')
            ->withCount('orders')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($customers);
    }

    public function customersToggleStatus($id)
    {
        $customer = User::findOrFail($id);
        $customer->update(['is_active' => !$customer->is_active]);

        // Revoke active tokens if blocked
        if (!$customer->is_active) {
            $customer->tokens()->delete();
        }

        return response()->json([
            'message' => $customer->is_active ? 'Customer unblocked.' : 'Customer blocked.',
            'customer' => $customer
        ]);
    }

    // Bulk upload from CSV
    public function bulkUploadProducts(Request $request)
    {
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:4096',
        ]);

        $file = $request->file('csv_file');
        $filePath = $file->getRealPath();
        $fileHandle = fopen($filePath, 'r');

        // Skip header
        $header = fgetcsv($fileHandle);

        $imported = 0;
        $failed = 0;

        while (($row = fgetcsv($fileHandle)) !== false) {
            try {
                // Columns mapping (example):
                // CategoryId, BrandId, Name, Description, Price, Stock, SKU
                if (count($row) < 7) continue;

                $categoryId = intval($row[0]);
                $brandId = !empty($row[1]) ? intval($row[1]) : null;
                $name = $row[2];
                $description = $row[3];
                $price = floatval($row[4]);
                $stock = intval($row[5]);
                $sku = $row[6];

                $slug = Str::slug($name);
                $originalSlug = $slug;
                $count = 1;
                while (Product::where('slug', $slug)->exists()) {
                    $slug = $originalSlug . '-' . $count++;
                }

                // Check Category exists
                if (!Category::where('id', $categoryId)->exists()) {
                    $failed++;
                    continue;
                }

                // Check brand exists if provided
                if ($brandId && !Brand::where('id', $brandId)->exists()) {
                    $brandId = null;
                }

                Product::updateOrCreate(
                    ['sku' => $sku],
                    [
                        'category_id' => $categoryId,
                        'brand_id' => $brandId,
                        'name' => $name,
                        'slug' => $slug,
                        'description' => $description,
                        'price' => $price,
                        'stock' => $stock,
                        'is_active' => true,
                    ]
                );

                $imported++;
            } catch (\Exception $e) {
                $failed++;
            }
        }

        fclose($fileHandle);

        return response()->json([
            'message' => "Import complete. Successfully imported/updated {$imported} products. Failed items: {$failed}."
        ]);
    }
}
