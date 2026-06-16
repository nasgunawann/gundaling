<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Reservation;

class ReservationController extends Controller
{
    public function index()
    {
        return response()->json(Reservation::with('table')->orderBy('time')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'guests' => 'required|integer|min:1',
            'table_id' => 'required|exists:tables,id',
            'time' => 'required|date',
            'status' => 'string|in:Confirmed,Arrived,Seated,Cancelled',
        ]);

        $reservation = Reservation::create($validated);

        return response()->json($reservation->load('table'), 201);
    }

    public function show(Reservation $reservation)
    {
        return response()->json($reservation->load('table'));
    }

    public function update(Request $request, Reservation $reservation)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:255',
            'guests' => 'sometimes|required|integer|min:1',
            'table_id' => 'sometimes|required|exists:tables,id',
            'time' => 'sometimes|required|date',
            'status' => 'string|in:Confirmed,Arrived,Seated,Cancelled',
        ]);

        $reservation->update($validated);

        return response()->json($reservation->load('table'));
    }

    public function destroy(Reservation $reservation)
    {
        $reservation->delete();
        return response()->json(null, 204);
    }
}
