<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Product;
use App\Models\Table;
use App\Models\Order;
use App\Models\Reservation;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:users,id',
            'pin' => 'required|string|size:4',
        ]);

        $user = User::findOrFail($request->id);

        if (!Hash::check($request->pin, $user->pin_hash)) {
            throw ValidationException::withMessages([
                'pin' => ['Invalid Secure PIN. Try again.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function staff()
    {
        $staff = User::select('id', 'name', 'role')->get();
        return response()->json($staff);
    }

    public function bootstrap()
    {
        return response()->json([
            'products' => Product::with('category')->get(),
            'tables' => Table::all(),
            'orders' => Order::with(['table', 'user', 'items.product'])->where('status', '!=', 'paid')->get(),
            'reservations' => Reservation::with('table')->orderBy('time')->get(),
        ]);
    }
}
