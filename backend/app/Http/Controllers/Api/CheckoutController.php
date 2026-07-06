<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutController extends Controller
{
    public function verifyCoupon(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $coupon = Coupon::where('code', $request->code)->first();

        if (!$coupon) {
            return response()->json(['message' => 'Invalid coupon code.'], 404);
        }

        if (!$coupon->isValid($request->subtotal)) {
            return response()->json(['message' => 'This coupon has expired or min order value not met.'], 400);
        }

        $discount = 0;
        if ($coupon->type === 'percentage') {
            $discount = ($request->subtotal * $coupon->value) / 100;
        } else {
            $discount = $coupon->value;
        }

        // Cap discount at subtotal
        if ($discount > $request->subtotal) {
            $discount = $request->subtotal;
        }

        return response()->json([
            'message' => 'Coupon applied successfully.',
            'coupon' => $coupon,
            'discount' => round($discount, 2),
        ]);
    }

    public function placeOrder(Request $request)
    {
        $request->validate([
            'address_id' => 'required|exists:addresses,id',
            'payment_method' => 'required|in:COD,Card,UPI,PayPal',
            'coupon_code' => 'nullable|string',
            'notes' => 'nullable|string',
            'guest_token' => 'nullable|string',
        ]);

        $user = $request->user();
        $userId = $user ? $user->id : null;
        $guestToken = $request->header('X-Guest-Token') ?: $request->input('guest_token');

        // Security check on address
        if ($userId) {
            $address = Address::where('user_id', $userId)->find($request->address_id);
            if (!$address) {
                return response()->json(['message' => 'Invalid delivery address.'], 400);
            }
        } else {
            // For guest, let's just make sure the address exists. (Usually address would be saved with guest_token, but let's allow it)
            $address = Address::find($request->address_id);
            if (!$address) {
                return response()->json(['message' => 'Invalid delivery address.'], 400);
            }
        }

        // Get Cart Items
        $cartQuery = Cart::query();
        if ($userId) {
            $cartQuery->where('user_id', $userId);
        } elseif ($guestToken) {
            $cartQuery->where('guest_token', $guestToken);
        } else {
            return response()->json(['message' => 'No active session or guest token.'], 400);
        }

        $cartItems = $cartQuery->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'Your cart is empty.'], 400);
        }

        // Verify stock before transaction
        foreach ($cartItems as $item) {
            $product = Product::find($item->product_id);
            $variant = $item->variant_id ? ProductVariant::find($item->variant_id) : null;
            $stock = $variant ? $variant->stock : $product->stock;

            if ($stock < $item->quantity) {
                return response()->json([
                    'message' => "Insufficient stock for product: {$product->name}" . ($variant ? " ({$variant->name}: {$variant->value})" : "")
                ], 400);
            }
        }

        // Calculations
        $subtotal = 0;
        foreach ($cartItems as $item) {
            $product = Product::find($item->product_id);
            $variant = $item->variant_id ? ProductVariant::find($item->variant_id) : null;
            $unitPrice = $product->discount_price ?: $product->price;
            if ($variant) {
                $unitPrice += $variant->price_modifier;
            }
            $subtotal += $unitPrice * $item->quantity;
        }

        // Discount
        $discount = 0;
        if ($request->filled('coupon_code')) {
            $coupon = Coupon::where('code', $request->coupon_code)->first();
            if ($coupon && $coupon->isValid($subtotal)) {
                if ($coupon->type === 'percentage') {
                    $discount = ($subtotal * $coupon->value) / 100;
                } else {
                    $discount = $coupon->value;
                }
                if ($discount > $subtotal) {
                    $discount = $subtotal;
                }
            }
        }

        // Tax (e.g. 5% GST)
        $tax = round(($subtotal - $discount) * 0.05, 2);

        // Shipping (Free above $150, else $10)
        $shipping = ($subtotal - $discount) >= 150 ? 0.00 : 10.00;

        $total = ($subtotal - $discount) + $tax + $shipping;

        // DB Transaction for stock deduction and order creation
        DB::beginTransaction();

        try {
            $orderNumber = 'ORD-' . strtoupper(Str::random(10));

            $order = Order::create([
                'user_id' => $userId,
                'order_number' => $orderNumber,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'shipping' => $shipping,
                'discount' => $discount,
                'total' => $total,
                'status' => 'pending',
                'payment_status' => $request->payment_method === 'COD' ? 'unpaid' : 'paid', // Mark card/upi/paypal as paid immediately (mock)
                'payment_method' => $request->payment_method,
                'address_id' => $request->address_id,
                'notes' => $request->notes,
            ]);

            // Save order items & deduct stock
            foreach ($cartItems as $item) {
                $product = Product::find($item->product_id);
                $variant = $item->variant_id ? ProductVariant::find($item->variant_id) : null;
                $unitPrice = $product->discount_price ?: $product->price;
                if ($variant) {
                    $unitPrice += $variant->price_modifier;
                    $variant->decrement('stock', $item->quantity);
                } else {
                    $product->decrement('stock', $item->quantity);
                }

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'quantity' => $item->quantity,
                    'price' => $unitPrice,
                ]);
            }

            // Empty cart
            if ($userId) {
                Cart::where('user_id', $userId)->delete();
            } else {
                Cart::where('guest_token', $guestToken)->delete();
            }

            DB::commit();

            return response()->json([
                'message' => 'Order placed successfully.',
                'order' => $order->load('items.product'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'An error occurred while placing your order. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
