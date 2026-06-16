<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Table;
use App\Events\OrderSent;
use App\Events\OrderPreparing;
use App\Events\OrderReady;
use App\Events\OrderServed;
use App\Events\OrderPaid;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['table', 'user', 'items.product']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        } else {
            $query->where('status', '!=', 'paid');
        }

        if ($request->has('table_id')) {
            $query->where('table_id', $request->table_id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'table_id' => 'required|exists:tables,id',
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.sent' => 'boolean',
            'items.*.note' => 'nullable|string',
        ]);

        $table = Table::findOrFail($request->table_id);
        $user = $request->user();

        $order = Order::where('table_id', $table->id)
            ->where('status', '!=', 'paid')
            ->first();

        if (!$order) {
            $order = Order::create([
                'table_id' => $table->id,
                'user_id' => $user->id,
                'status' => 'pending',
                'total' => 0,
            ]);
            $table->update(['status' => 'Occupied']);
        }

        $incomingSentCount = 0;
        $productIds = collect($request->items)->pluck('product_id')->toArray();
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');
        $existingItems = OrderItem::where('order_id', $order->id)->get()->groupBy(function ($item) {
            return $item->product_id . '_' . ($item->sent ? '1' : '0');
        });

        foreach ($request->items as $item) {
            $productId = $item['product_id'];
            $product = $products->get($productId);
            if (!$product) {
                continue;
            }
            $sent = $item['sent'] ?? false;

            if ($sent) {
                $incomingSentCount++;
            }

            $key = $productId . '_' . ($sent ? '1' : '0');
            $orderItem = isset($existingItems[$key]) ? $existingItems[$key]->first() : null;

            if ($orderItem) {
                $orderItem->update([
                    'qty' => $item['qty'],
                    'note' => $item['note'] ?? null,
                ]);
            } else {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $productId,
                    'qty' => $item['qty'],
                    'unit_price' => $product->price,
                    'sent' => $sent,
                    'note' => $item['note'] ?? null,
                ]);
            }
        }

        $this->recalculateOrderTotal($order);

        if ($incomingSentCount > 0) {
            event(new OrderSent($order));
        }

        return response()->json($order->load(['table', 'user', 'items.product']));
    }

    public function transmit(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        if ($order->status === 'paid') {
            return response()->json(['message' => 'Cannot transmit items to a paid order.'], 422);
        }

        $unsentItems = $order->items()->where('sent', false)->get();

        if ($unsentItems->count() > 0) {
            foreach ($unsentItems as $item) {
                $item->update(['sent' => true]);
            }

            $order->update(['status' => 'pending']);
            $this->recalculateOrderTotal($order);

            $order->table->update(['status' => 'Occupied']);

            event(new OrderSent($order));
        }

        return response()->json($order->load(['table', 'user', 'items.product']));
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:pending,preparing,ready,served,paid',
        ]);

        $order = Order::findOrFail($id);
        $order->update(['status' => $request->status]);

        if ($request->status === 'paid') {
            $order->table->update(['status' => 'Available']);
            $order->items()->update(['sent' => true]);
            event(new OrderPaid($order));
        } elseif ($request->status === 'preparing') {
            event(new OrderPreparing($order));
        } elseif ($request->status === 'ready') {
            event(new OrderReady($order));
        } elseif ($request->status === 'served') {
            event(new OrderServed($order));
        }

        return response()->json($order->load(['table', 'user', 'items.product']));
    }

    private function recalculateOrderTotal(Order $order)
    {
        $subtotal = $order->items()->sum(\Illuminate\Support\Facades\DB::raw('unit_price * qty'));
        $total = $subtotal * 1.1;
        $order->update(['total' => $total]);
    }
}
