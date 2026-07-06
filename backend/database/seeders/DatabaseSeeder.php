<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Address;
use App\Models\Coupon;
use App\Models\Review;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Roles
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $customerRole = Role::create(['name' => 'customer', 'guard_name' => 'web']);

        // 2. Create Users
        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@ecom.com',
            'phone' => '9876543210',
            'password' => bcrypt('password'),
            'profile_picture' => null,
        ]);
        $admin->assignRole($adminRole);

        $customer = User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '1234567890',
            'password' => bcrypt('password'),
            'profile_picture' => null,
        ]);
        $customer->assignRole($customerRole);

        // 3. Create Addresses for customer
        Address::create([
            'user_id' => $customer->id,
            'type' => 'shipping',
            'name' => 'John Doe Home',
            'phone' => '1234567890',
            'address_line1' => '123 Main Street',
            'address_line2' => 'Apartment 4B',
            'city' => 'New York',
            'state' => 'NY',
            'postal_code' => '10001',
            'country' => 'United States',
            'is_default' => true,
        ]);

        Address::create([
            'user_id' => $customer->id,
            'type' => 'billing',
            'name' => 'John Doe Office',
            'phone' => '0987654321',
            'address_line1' => '456 Business Road',
            'address_line2' => 'Suite 100',
            'city' => 'New York',
            'state' => 'NY',
            'postal_code' => '10022',
            'country' => 'United States',
            'is_default' => false,
        ]);

        // 4. Create Categories
        $electronics = Category::create([
            'name' => 'Electronics',
            'slug' => 'electronics',
            'description' => 'Gadgets, devices, and accessories',
            'image' => 'categories/electronics.jpg'
        ]);

        $mobiles = Category::create([
            'parent_id' => $electronics->id,
            'name' => 'Smartphones',
            'slug' => 'smartphones',
            'description' => 'Latest mobile phones',
            'image' => 'categories/mobiles.jpg'
        ]);

        $audio = Category::create([
            'parent_id' => $electronics->id,
            'name' => 'Audio & Headphones',
            'slug' => 'audio-headphones',
            'description' => 'Wireless earbuds and headphones',
            'image' => 'categories/audio.jpg'
        ]);

        $fashion = Category::create([
            'name' => 'Fashion',
            'slug' => 'fashion',
            'description' => 'Apparel, footwear, and accessories',
            'image' => 'categories/fashion.jpg'
        ]);

        $shoes = Category::create([
            'parent_id' => $fashion->id,
            'name' => 'Shoes',
            'slug' => 'shoes',
            'description' => 'Sneakers and athletic shoes',
            'image' => 'categories/shoes.jpg'
        ]);

        // 5. Create Brands
        $apple = Brand::create(['name' => 'Apple', 'slug' => 'apple', 'logo' => 'brands/apple.png']);
        $samsung = Brand::create(['name' => 'Samsung', 'slug' => 'samsung', 'logo' => 'brands/samsung.png']);
        $sony = Brand::create(['name' => 'Sony', 'slug' => 'sony', 'logo' => 'brands/sony.png']);
        $nike = Brand::create(['name' => 'Nike', 'slug' => 'nike', 'logo' => 'brands/nike.png']);

        // 6. Create Products
        // Product 1: iPhone 15 Pro
        $iphone = Product::create([
            'category_id' => $mobiles->id,
            'brand_id' => $apple->id,
            'name' => 'Apple iPhone 15 Pro',
            'slug' => 'apple-iphone-15-pro',
            'description' => 'Experience the titanium design, groundbreaking A17 Pro chip, customizable Action button, and the most powerful iPhone camera system ever.',
            'specifications' => [
                'Display' => '6.1-inch Super Retina XDR with ProMotion',
                'Processor' => 'A17 Pro chip with 6-core GPU',
                'Camera' => '48MP Main, 12MP Ultra Wide, 12MP Telephoto',
                'Storage' => '128GB / 256GB / 512GB',
                'Battery' => 'Up to 23 hours video playback',
                'Weight' => '187 grams'
            ],
            'price' => 999.00,
            'discount_price' => 899.00,
            'stock' => 50,
            'sku' => 'IPH15PRO-128',
            'is_featured' => true,
            'is_active' => true,
            'rating' => 4.8
        ]);

        ProductImage::create(['product_id' => $iphone->id, 'image_path' => 'products/iphone-front.jpg']);
        ProductImage::create(['product_id' => $iphone->id, 'image_path' => 'products/iphone-back.jpg']);

        // iPhone Variants
        ProductVariant::create(['product_id' => $iphone->id, 'name' => 'Storage', 'value' => '128GB', 'price_modifier' => 0.00, 'stock' => 20]);
        ProductVariant::create(['product_id' => $iphone->id, 'name' => 'Storage', 'value' => '256GB', 'price_modifier' => 100.00, 'stock' => 15]);
        ProductVariant::create(['product_id' => $iphone->id, 'name' => 'Storage', 'value' => '512GB', 'price_modifier' => 300.00, 'stock' => 15]);
        ProductVariant::create(['product_id' => $iphone->id, 'name' => 'Color', 'value' => 'Natural Titanium', 'price_modifier' => 0.00, 'stock' => 25]);
        ProductVariant::create(['product_id' => $iphone->id, 'name' => 'Color', 'value' => 'Blue Titanium', 'price_modifier' => 0.00, 'stock' => 25]);

        // Reviews for iPhone
        Review::create([
            'product_id' => $iphone->id,
            'user_id' => $customer->id,
            'rating' => 5,
            'comment' => 'Absolutely amazing phone. The titanium feel is premium and it is super light. Highly recommended!',
            'is_approved' => true
        ]);

        // Product 2: Sony Headphones
        $headphones = Product::create([
            'category_id' => $audio->id,
            'brand_id' => $sony->id,
            'name' => 'Sony WH-1000XM4 Wireless Headphones',
            'slug' => 'sony-wh-1000xm4-wireless-headphones',
            'description' => 'Industry-leading noise canceling wireless over-ear headphones with microphone, voice assistant integration, and 30-hour battery life.',
            'specifications' => [
                'Headphone Type' => 'Closed, dynamic',
                'Driver Unit' => '40mm, dome type (CCAW Voice Coil)',
                'Frequency Response' => '4Hz-40,000Hz',
                'Battery Life' => 'Up to 30 hours',
                'Charging Time' => 'Approx. 3 hours',
                'Weight' => '254 grams'
            ],
            'price' => 348.00,
            'discount_price' => 299.00,
            'stock' => 100,
            'sku' => 'SONYWHXM4',
            'is_featured' => true,
            'is_active' => true,
            'rating' => 4.7
        ]);

        ProductImage::create(['product_id' => $headphones->id, 'image_path' => 'products/sony-headphones.jpg']);
        ProductVariant::create(['product_id' => $headphones->id, 'name' => 'Color', 'value' => 'Black', 'price_modifier' => 0.00, 'stock' => 60]);
        ProductVariant::create(['product_id' => $headphones->id, 'name' => 'Color', 'value' => 'Silver', 'price_modifier' => 0.00, 'stock' => 40]);

        Review::create([
            'product_id' => $headphones->id,
            'user_id' => $customer->id,
            'rating' => 4,
            'comment' => 'Incredible noise cancellation, sound profile is warm and comfortable. The touch controls take a bit to get used to.',
            'is_approved' => true
        ]);

        // Product 3: Samsung Galaxy S24 Ultra
        $s24 = Product::create([
            'category_id' => $mobiles->id,
            'brand_id' => $samsung->id,
            'name' => 'Samsung Galaxy S24 Ultra',
            'slug' => 'samsung-galaxy-s24-ultra',
            'description' => 'Welcome to the era of mobile AI. With Galaxy S24 Ultra in your hands, you can unleash whole new levels of creativity, productivity, and possibility.',
            'specifications' => [
                'Display' => '6.8-inch Dynamic AMOLED 2X, 120Hz',
                'Processor' => 'Snapdragon 8 Gen 3 for Galaxy',
                'Camera' => '200MP + 50MP + 12MP + 10MP Quad Camera',
                'Storage' => '256GB / 512GB / 1TB',
                'Battery' => '5000 mAh',
                'Weight' => '232 grams'
            ],
            'price' => 1299.00,
            'discount_price' => 1199.00,
            'stock' => 30,
            'sku' => 'SAMS24ULTRA',
            'is_featured' => false,
            'is_active' => true,
            'rating' => 4.6
        ]);

        ProductImage::create(['product_id' => $s24->id, 'image_path' => 'products/s24-front.jpg']);
        ProductVariant::create(['product_id' => $s24->id, 'name' => 'Storage', 'value' => '256GB', 'price_modifier' => 0.00, 'stock' => 15]);
        ProductVariant::create(['product_id' => $s24->id, 'name' => 'Storage', 'value' => '512GB', 'price_modifier' => 120.00, 'stock' => 15]);

        Review::create([
            'product_id' => $s24->id,
            'user_id' => $customer->id,
            'rating' => 5,
            'comment' => 'The camera zoom is mind-blowing! Galaxy AI features like live translate are very useful.',
            'is_approved' => true
        ]);

        // Product 4: Nike Air Max
        $nikeShoes = Product::create([
            'category_id' => $shoes->id,
            'brand_id' => $nike->id,
            'name' => 'Nike Air Max 90 Sneakers',
            'slug' => 'nike-air-max-90-sneakers',
            'description' => 'Nothing as fly, nothing as comfortable, nothing as proven. The Nike Air Max 90 stays true to its OG running roots with its iconic Waffle sole, stitched overlays, and classic TPU accents.',
            'specifications' => [
                'Upper Material' => 'Leather and textile mesh',
                'Sole Material' => 'Rubber waffle outsole',
                'Cushioning' => 'Visible Max Air unit',
                'Closure' => 'Lace-up'
            ],
            'price' => 130.00,
            'discount_price' => 110.00,
            'stock' => 80,
            'sku' => 'NIKEAM90',
            'is_featured' => true,
            'is_active' => true,
            'rating' => 4.5
        ]);

        ProductImage::create(['product_id' => $nikeShoes->id, 'image_path' => 'products/nike-air-max.jpg']);
        ProductVariant::create(['product_id' => $nikeShoes->id, 'name' => 'Size', 'value' => 'US 9', 'price_modifier' => 0.00, 'stock' => 20]);
        ProductVariant::create(['product_id' => $nikeShoes->id, 'name' => 'Size', 'value' => 'US 10', 'price_modifier' => 0.00, 'stock' => 30]);
        ProductVariant::create(['product_id' => $nikeShoes->id, 'name' => 'Size', 'value' => 'US 11', 'price_modifier' => 0.00, 'stock' => 30]);

        Review::create([
            'product_id' => $nikeShoes->id,
            'user_id' => $customer->id,
            'rating' => 4,
            'comment' => 'Very comfortable sneakers for everyday use. Classic style that matches everything.',
            'is_approved' => true
        ]);

        // 7. Create Coupons
        Coupon::create([
            'code' => 'WELCOME10',
            'type' => 'percentage',
            'value' => 10.00,
            'min_order_value' => 50.00,
            'start_date' => now()->subDay(),
            'end_date' => now()->addYear(),
            'is_active' => true
        ]);

        Coupon::create([
            'code' => 'FLAT50',
            'type' => 'flat',
            'value' => 50.00,
            'min_order_value' => 200.00,
            'start_date' => now()->subDay(),
            'end_date' => now()->addYear(),
            'is_active' => true
        ]);
    }
}
