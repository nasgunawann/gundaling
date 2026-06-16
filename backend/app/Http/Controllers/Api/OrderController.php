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

        foreach ($request->items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $sent = $item['sent'] ?? false;

            if ($sent) {
                $incomingSentCount++;
            }

            $orderItem = OrderItem::where('order_id', $order->id)
                ->where('product_id', $product->id)
                ->where('sent', $sent)
                ->first();

            if ($orderItem) {
                $orderItem->update(['qty' => $item['qty']]);
            } else {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'qty' => $item['qty'],
                    'unit_price' => $product->price,
                    'sent' => $sent,
                ]);
            }
        }

        $this->recalculateOrderTotal($order);

        if ($incomingSentCount > 0) {
            broadcast(new OrderSent($order))->toOthers();
        }

        return response()->json($order->load(['table', 'user', 'items.product']));
    }

    public function transmit(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $unsentItems = $order->items()->where('sent', false)->get();

        if ($unsentItems->count() > 0) {
            foreach ($unsentItems as $item) {
                $item->update(['sent' => true]);
            }

            $order->update(['status' => 'pending']);
            $this->recalculateOrderTotal($order);

            $order->table->update(['status' => 'Occupied']);

            broadcast(new OrderSent($order))->toOthers();
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
            broadcast(new OrderPaid($order))->toOthers();
        } elseif ($request->status === 'preparing') {
            broadcast(new OrderPreparing($order))->toOthers();
        } elseif ($request->status === 'ready') {
            broadcast(new OrderReady($order))->toOthers();
        } elseif ($request->status === 'served') {
            broadcast(new OrderServed($order))->toOthers();
        }

        return response()->json($order->load(['table', 'user', 'items.product']));
    }

    public function kitchenQueue()
    {
        $orders = Order::with(['table', 'user', 'items.product'])
            ->whereIn('status', ['pending', 'preparing', 'ready'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($orders);
    }

    private function recalculateOrderTotal(Order $order)
    {
        $subtotal = 0;
        foreach ($order->items as $item) {
            $subtotal += $item->unit_price * $item->qty;
        }
        $total = $subtotal * 1.1; // Including 10% service charge
        $order->update(['total' => $total]);
    }
}
