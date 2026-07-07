<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ChatbotController;
use Illuminate\Support\Facades\Route;

// --- PUBLIC ROUTES ---

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Catalog
Route::get('/categories', [ProductController::class, 'categories']);
Route::get('/brands', [ProductController::class, 'brands']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/featured', [ProductController::class, 'getFeatured']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::post('/chatbot/message', [ChatbotController::class, 'handleChat']);

// Cart (Guest / Direct)
Route::get('/cart', [CartController::class, 'getCart']);
Route::post('/cart/add', [CartController::class, 'addToCart']);
Route::put('/cart/update/{id}', [CartController::class, 'updateQuantity']);
Route::delete('/cart/remove/{id}', [CartController::class, 'removeFromCart']);


// --- CUSTOMER ROUTES (AUTHENTICATED) ---

Route::middleware('auth:sanctum')->group(function () {
    // Profile
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/profile/update', [AuthController::class, 'updateProfile']);
    Route::post('/profile/password', [AuthController::class, 'changePassword']);

    // Saved Addresses
    Route::get('/addresses', [AuthController::class, 'getAddresses']);
    Route::post('/addresses', [AuthController::class, 'addAddress']);
    Route::put('/addresses/{id}', [AuthController::class, 'updateAddress']);
    Route::delete('/addresses/{id}', [AuthController::class, 'deleteAddress']);

    // Cart merge on login
    Route::post('/cart/merge', [CartController::class, 'mergeCart']);

    // Checkout
    Route::post('/checkout/verify-coupon', [CheckoutController::class, 'verifyCoupon']);
    Route::post('/checkout/place-order', [CheckoutController::class, 'placeOrder']);

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);

    // Product reviews
    Route::post('/products/{id}/reviews', [ProductController::class, 'submitReview']);
});


// --- ADMIN ROUTES ---

Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    // Dashboard Stats
    Route::get('/stats', [AdminController::class, 'dashboardStats']);

    // Categories
    Route::get('/categories', [AdminController::class, 'categoriesIndex']);
    Route::post('/categories', [AdminController::class, 'categoriesStore']);
    Route::post('/categories/{id}', [AdminController::class, 'categoriesUpdate']); // Using POST to allow image upload in multipart/form-data
    Route::delete('/categories/{id}', [AdminController::class, 'categoriesDestroy']);

    // Brands
    Route::get('/brands', [AdminController::class, 'brandsIndex']);
    Route::post('/brands', [AdminController::class, 'brandsStore']);
    Route::post('/brands/{id}', [AdminController::class, 'brandsUpdate']); // POST to allow logo upload
    Route::delete('/brands/{id}', [AdminController::class, 'brandsDestroy']);

    // Products
    Route::get('/products', [AdminController::class, 'productsIndex']);
    Route::post('/products', [AdminController::class, 'productsStore']);
    Route::post('/products/{id}', [AdminController::class, 'productsUpdate']); // POST to allow image/file uploads
    Route::delete('/products/{id}', [AdminController::class, 'productsDestroy']);
    Route::delete('/products/images/{id}', [AdminController::class, 'deleteProductImage']);
    Route::post('/products/bulk-upload', [AdminController::class, 'bulkUploadProducts']);

    // Orders
    Route::get('/orders', [AdminController::class, 'ordersIndex']);
    Route::get('/orders/{id}', [AdminController::class, 'ordersShow']);
    Route::put('/orders/{id}/status', [AdminController::class, 'ordersUpdateStatus']);

    // Reviews
    Route::get('/reviews', [AdminController::class, 'reviewsIndex']);
    Route::put('/reviews/{id}/approve', [AdminController::class, 'reviewsApprove']);
    Route::delete('/reviews/{id}', [AdminController::class, 'reviewsDestroy']);

    // Customers
    Route::get('/customers', [AdminController::class, 'customersIndex']);
    Route::put('/customers/{id}/toggle-status', [AdminController::class, 'customersToggleStatus']);
});
