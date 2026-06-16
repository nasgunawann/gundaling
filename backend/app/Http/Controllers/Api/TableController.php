<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Table;

class TableController extends Controller
{
    public function index()
    {
        return response()->json(Table::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:tables,name|max:255',
            'seats' => 'required|integer|min:1',
            'shape' => 'required|string|in:circle,square,rectangle',
            'pos_x' => 'numeric|between:0,100',
            'pos_y' => 'numeric|between:0,100',
            'status' => 'string|in:Available,Reserved,Occupied',
        ]);

        $table = Table::create($validated);

        return response()->json($table, 201);
    }

    public function show(Table $table)
    {
        return response()->json($table);
    }

    public function update(Request $request, Table $table)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:tables,name,' . $table->id,
            'seats' => 'sometimes|required|integer|min:1',
            'shape' => 'sometimes|required|string|in:circle,square,rectangle',
            'pos_x' => 'numeric|between:0,100',
            'pos_y' => 'numeric|between:0,100',
            'status' => 'string|in:Available,Reserved,Occupied',
        ]);

        $table->update($validated);

        return response()->json($table);
    }

    public function destroy(Table $table)
    {
        $table->delete();
        return response()->json(null, 204);
    }
}
