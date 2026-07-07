<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatbotController extends Controller
{
    public function handleChat(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'history' => 'nullable|array',
            'history.*.sender' => 'required|in:user,bot',
            'history.*.text' => 'required|string',
        ]);

        $message = $request->input('message');
        $history = $request->input('history', []);

        // 1. Fetch active products for catalog context
        $products = Product::where('is_active', true)
            ->select('id', 'name', 'slug', 'price', 'discount_price', 'rating', 'stock', 'category_id', 'brand_id')
            ->with(['category:id,name', 'brand:id,name'])
            ->limit(80) // Fetch top 80 products to fit in context window and be responsive
            ->get();

        $catalogContext = "Here is the active product catalog of our store. Use this catalog to recommend products. If a user asks for something we don't have, politely mention that we don't carry it, or suggest the closest match from this list:\n\n";
        foreach ($products as $product) {
            $priceText = "Price: ₹" . number_format($product->price, 2);
            if ($product->discount_price && $product->discount_price < $product->price) {
                $priceText .= " (Discounted Price: ₹" . number_format($product->discount_price, 2) . ")";
            }
            $categoryName = $product->category ? $product->category->name : 'General';
            $brandName = $product->brand ? $product->brand->name : 'Generic';
            $ratingText = $product->rating ? "Rating: {$product->rating}/5" : "No ratings yet";
            $stockText = $product->stock > 0 ? "In Stock ({$product->stock} items left)" : "Out of Stock";

            $catalogContext .= "- **{$product->name}**\n";
            $catalogContext .= "  - Slug/Url ID: `{$product->slug}`\n";
            $catalogContext .= "  - Category: {$categoryName} | Brand: {$brandName}\n";
            $catalogContext .= "  - {$priceText} | {$ratingText} | {$stockText}\n\n";
        }

        // 2. Fetch authenticated user details and orders (if logged in)
        $user = $request->user('sanctum');
        $userContext = "";
        if ($user) {
            $userContext = "Authenticated User Info:\n";
            $userContext .= "- Name: {$user->name}\n";
            $userContext .= "- Email: {$user->email}\n";
            $userContext .= "- Phone: " . ($user->phone ?? 'N/A') . "\n\n";

            $orders = $user->orders()->latest()->limit(5)->with('items.product')->get();
            if ($orders->count() > 0) {
                $userContext .= "User's Recent Orders:\n";
                foreach ($orders as $order) {
                    $items = [];
                    foreach ($order->items as $item) {
                        $pName = $item->product ? $item->product->name : 'Product';
                        $items[] = "{$item->quantity}x {$pName}";
                    }
                    $itemsText = implode(', ', $items);
                    $userContext .= "- Order #{$order->order_number} | Date: {$order->created_at->format('Y-m-d')} | Status: " . strtoupper($order->status) . " | Payment: " . strtoupper($order->payment_status) . " | Total: ₹" . number_format($order->total, 2) . " | Items: [{$itemsText}]\n";
                }
            } else {
                $userContext .= "User has no orders yet.\n";
            }
        } else {
            $userContext = "The user is a Guest (Not logged in). You cannot show order details unless they login.\n";
        }

        // 3. Define System Instructions
        $systemInstructions = "You are a professional, helpful, and friendly AI Chatbot Assistant for an online E-commerce store (LaravelReactEcom). Your job is to assist customers with product recommendations, catalog queries, and customer support (returns, delivery, tracking, general FAQs).\n\n";
        $systemInstructions .= "RULES:\n";
        $systemInstructions .= "1. **Language**: Be polite and warm. Respond in Hinglish (Hindi written in English script) or English, depending on how the customer talks to you. Example Hinglish: 'Haan, humare paas bilkul ye laptop available hai.'\n";
        $systemInstructions .= "2. **Product Recommendations**: Recommend only products listed in the catalog below. Do not make up products. Format recommended products nicely. When mentioning a product, always provide a link to it using this markdown format: `[Product Name](/product/slug)` (where slug is the Slug/Url ID of the product from the catalog, e.g., `/product/iphone-15`). DO NOT write absolute domain names in links, just relative paths.\n";
        $systemInstructions .= "3. **Customer Support**: Answer FAQs politely. For order tracking, if the user asks about order status and they are logged in, use the provided order history to give exact details. If they are not logged in, ask them to log in to see their order history.\n";
        $systemInstructions .= "4. **Stock**: If a product is 'Out of Stock', mention it to the customer but suggest similar alternatives.\n";
        $systemInstructions .= "5. **Keep it Concise**: Don't output overly long responses. Keep paragraphs short and use bullet points for lists. Bold key information.\n\n";
        $systemInstructions .= $catalogContext . "\n";
        $systemInstructions .= $userContext;

        // 4. Format chat history for Gemini API
        $contents = [];
        foreach ($history as $msg) {
            $role = $msg['sender'] === 'user' ? 'user' : 'model';
            $contents[] = [
                'role' => $role,
                'parts' => [
                    ['text' => $msg['text']]
                ]
            ];
        }
        // Append current message
        $contents[] = [
            'role' => 'user',
            'parts' => [
                ['text' => $message]
            ]
        ];

        // 5. Call Gemini API
        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return response()->json([
                'reply' => "Gemini API key configure nahi hai backend me. Please setup your GEMINI_API_KEY in .env file.",
                'error' => 'API key missing'
            ], 500);
        }

        $apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey;

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post($apiUrl, [
                'contents' => $contents,
                'systemInstruction' => [
                    'parts' => [
                        ['text' => $systemInstructions]
                    ]
                ]
            ]);

            if ($response->successful()) {
                $responseData = $response->json();
                $replyText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? "Sorry, main abhi reply nahi kar pa raha hoon.";
                return response()->json([
                    'reply' => $replyText
                ]);
            } else {
                Log::error("Gemini API Error: Status " . $response->status() . " | Body: " . $response->body());
                return response()->json([
                    'reply' => "Sorry, Gemini API se query fail ho gayi. Please support team se contact karein ya thodi der baad try karein.",
                    'error' => 'API response error'
                ], 502);
            }
        } catch (\Exception $e) {
            Log::error("Gemini Connection Exception: " . $e->getMessage());
            return response()->json([
                'reply' => "Humare server me Gemini API connect karte waqt problem aayi: " . $e->getMessage(),
                'error' => 'Server error'
            ], 500);
        }
    }
}
