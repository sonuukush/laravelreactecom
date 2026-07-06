<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Review;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function categories()
    {
        $categories = Category::whereNull('parent_id')
            ->with('children')
            ->get();
        return response()->json($categories);
    }

    public function brands()
    {
        $brands = Brand::all();
        return response()->json($brands);
    }

    public function index(Request $request)
    {
        $query = Product::where('is_active', true)->with(['images', 'category', 'brand']);

        // Search Filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        // Category Filter
        if ($request->filled('category')) {
            $categorySlug = $request->category;
            $category = Category::where('slug', $categorySlug)->first();
            if ($category) {
                $categoryIds = array_merge([$category->id], $category->children()->pluck('id')->toArray());
                $query->whereIn('category_id', $categoryIds);
            }
        }

        // Brand Filter
        if ($request->filled('brand')) {
            $brandSlugs = is_array($request->brand) ? $request->brand : explode(',', $request->brand);
            $brandIds = Brand::whereIn('slug', $brandSlugs)->pluck('id')->toArray();
            if (!empty($brandIds)) {
                $query->whereIn('brand_id', $brandIds);
            }
        }

        // Price Filter
        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // Rating Filter
        if ($request->filled('rating')) {
            $query->where('rating', '>=', $request->rating);
        }

        // Sorting
        $sort = $request->get('sort', 'newest');
        switch ($sort) {
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;
            case 'rating':
                $query->orderBy('rating', 'desc');
                break;
            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $products = $query->paginate($request->get('limit', 12));

        return response()->json($products);
    }

    public function show($slug)
    {
        $product = Product::where('slug', $slug)
            ->where('is_active', true)
            ->with(['images', 'variants', 'category', 'brand'])
            ->firstOrFail();

        // Load approved reviews
        $reviews = Review::where('product_id', $product->id)
            ->where('is_approved', true)
            ->with('user:id,name,profile_picture')
            ->orderBy('created_at', 'desc')
            ->get();

        // Get related products
        $related = Product::where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->where('is_active', true)
            ->with('images')
            ->limit(4)
            ->get();

        return response()->json([
            'product' => $product,
            'reviews' => $reviews,
            'related' => $related,
        ]);
    }

    public function getFeatured()
    {
        $products = Product::where('is_featured', true)
            ->where('is_active', true)
            ->with('images')
            ->limit(8)
            ->get();

        return response()->json($products);
    }

    public function submitReview(Request $request, $productId)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:3',
        ]);

        $product = Product::findOrFail($productId);
        $userId = $request->user()->id;

        // Check if user already reviewed
        $existing = Review::where('product_id', $productId)->where('user_id', $userId)->first();
        if ($existing) {
            return response()->json(['message' => 'You have already reviewed this product.'], 400);
        }

        $review = Review::create([
            'product_id' => $productId,
            'user_id' => $userId,
            'rating' => $request->rating,
            'comment' => $request->comment,
            'is_approved' => false, // Requires admin approval
        ]);

        return response()->json([
            'message' => 'Review submitted successfully. It will be visible once approved.',
            'review' => $review,
        ], 201);
    }
}
