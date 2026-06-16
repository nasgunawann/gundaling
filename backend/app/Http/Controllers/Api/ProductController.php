<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;

class ProductController extends Controller
{
    public function index()
    {
        return response()->json(Product::with('category')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category_id' => 'required|exists:categories,id',
            'image' => 'nullable|string',
            'desc' => 'nullable|string',
            'badge' => 'nullable|string',
            'out_of_stock' => 'boolean',
            'details' => 'nullable|array',
            'standards' => 'nullable|array',
            'active' => 'boolean',
        ]);

        $product = Product::create($validated);

        return response()->json($product, 21);
    }

    public function show(Product $product)
    {
        return response()->json($product->load('category'));
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'category_id' => 'sometimes|required|exists:categories,id',
            'image' => 'nullable|string',
            'desc' => 'nullable|string',
            'badge' => 'nullable|string',
            'out_of_stock' => 'boolean',
            'details' => 'nullable|array',
            'standards' => 'nullable|array',
            'active' => 'boolean',
        ]);

        $product->update($validated);

        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(null, 24);
    }
}
