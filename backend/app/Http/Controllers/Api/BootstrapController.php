<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Table;
use App\Models\Order;
use App\Models\Reservation;
use App\Models\Category;

class BootstrapController extends Controller
{
    public function __invoke()
    {
        return response()->json([
            'products' => Product::with('category')->get(),
            'tables' => Table::all(),
            'orders' => Order::with(['table', 'user', 'items.product'])->where('status', '!=', 'paid')->get(),
            'reservations' => Reservation::with('table')->orderBy('time')->get(),
            'categories' => Category::orderBy('sort_order')->get(),
        ]);
    }
}
