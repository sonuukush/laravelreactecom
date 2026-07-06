<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;

class CartController extends Controller
{
    private function getUserIdOrGuestToken(Request $request)
    {
        $userId = $request->user() ? $request->user()->id : null;
        $guestToken = $request->header('X-Guest-Token') ?: $request->input('guest_token');

        return [$userId, $guestToken];
    }

    public function getCart(Request $request)
    {
        [$userId, $guestToken] = $this->getUserIdOrGuestToken($request);

        $query = Cart::query()->with(['product.images', 'variant']);

        if ($userId) {
            $query->where('user_id', $userId);
        } elseif ($guestToken) {
            $query->where('guest_token', $guestToken);
        } else {
            return response()->json([]);
        }

        $items = $query->get();

        return response()->json($items);
    }

    public function addToCart(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'required|integer|min:1',
            'guest_token' => 'nullable|string',
        ]);

        [$userId, $guestToken] = $this->getUserIdOrGuestToken($request);

        if (!$userId && !$guestToken) {
            return response()->json(['message' => 'User ID or Guest Token is required.'], 400);
        }

        $product = Product::findOrFail($request->product_id);
        $variant = $request->variant_id ? ProductVariant::findOrFail($request->variant_id) : null;

        // Check stock
        $availableStock = $variant ? $variant->stock : $product->stock;
        if ($availableStock < $request->quantity) {
            return response()->json(['message' => 'Requested quantity exceeds available stock.'], 400);
        }

        // Find existing cart item
        $cartQuery = Cart::where('product_id', $request->product_id)
            ->where('variant_id', $request->variant_id);

        if ($userId) {
            $cartQuery->where('user_id', $userId);
        } else {
            $cartQuery->where('guest_token', $guestToken);
        }

        $cartItem = $cartQuery->first();

        if ($cartItem) {
            $newQuantity = $cartItem->quantity + $request->quantity;
            if ($availableStock < $newQuantity) {
                return response()->json(['message' => 'Total quantity in cart exceeds available stock.'], 400);
            }
            $cartItem->update(['quantity' => $newQuantity]);
        } else {
            $cartItem = Cart::create([
                'user_id' => $userId,
                'guest_token' => $userId ? null : $guestToken,
                'product_id' => $request->product_id,
                'variant_id' => $request->variant_id,
                'quantity' => $request->quantity,
            ]);
        }

        return response()->json([
            'message' => 'Item added to cart.',
            'item' => $cartItem->load(['product.images', 'variant']),
        ]);
    }

    public function updateQuantity(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        [$userId, $guestToken] = $this->getUserIdOrGuestToken($request);

        $cartItem = Cart::findOrFail($id);

        // Security check
        if ($userId && $cartItem->user_id !== $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        } elseif (!$userId && $cartItem->guest_token !== $guestToken) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product = Product::findOrFail($cartItem->product_id);
        $variant = $cartItem->variant_id ? ProductVariant::findOrFail($cartItem->variant_id) : null;

        $availableStock = $variant ? $variant->stock : $product->stock;
        if ($availableStock < $request->quantity) {
            return response()->json(['message' => 'Requested quantity exceeds available stock.'], 400);
        }

        $cartItem->update(['quantity' => $request->quantity]);

        return response()->json([
            'message' => 'Cart updated.',
            'item' => $cartItem->load(['product.images', 'variant']),
        ]);
    }

    public function removeFromCart(Request $request, $id)
    {
        [$userId, $guestToken] = $this->getUserIdOrGuestToken($request);

        $cartItem = Cart::findOrFail($id);

        if ($userId && $cartItem->user_id !== $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        } elseif (!$userId && $cartItem->guest_token !== $guestToken) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $cartItem->delete();

        return response()->json([
            'message' => 'Item removed from cart.',
        ]);
    }

    public function mergeCart(Request $request)
    {
        $request->validate([
            'guest_token' => 'required|string',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Authenticated user required.'], 401);
        }

        $guestItems = Cart::where('guest_token', $request->guest_token)->get();

        foreach ($guestItems as $guestItem) {
            $userItem = Cart::where('user_id', $user->id)
                ->where('product_id', $guestItem->product_id)
                ->where('variant_id', $guestItem->variant_id)
                ->first();

            if ($userItem) {
                // Merge quantities
                $product = Product::find($guestItem->product_id);
                $variant = $guestItem->variant_id ? ProductVariant::find($guestItem->variant_id) : null;
                $availableStock = $variant ? $variant->stock : $product->stock;

                $newQuantity = $userItem->quantity + $guestItem->quantity;
                if ($newQuantity > $availableStock) {
                    $newQuantity = $availableStock; // Cap at available stock
                }

                $userItem->update(['quantity' => $newQuantity]);
                $guestItem->delete();
            } else {
                // Transfer ownership
                $guestItem->update([
                    'user_id' => $user->id,
                    'guest_token' => null,
                ]);
            }
        }

        $mergedCart = Cart::where('user_id', $user->id)->with(['product.images', 'variant'])->get();

        return response()->json([
            'message' => 'Cart merged successfully.',
            'cart' => $mergedCart,
        ]);
    }
}
