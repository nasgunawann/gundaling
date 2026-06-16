<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\OrderController;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/staff-members', [AuthController::class, 'staff']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/bootstrap', [AuthController::class, 'bootstrap']);

    // Products
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store'])->middleware('role:Manager');
    Route::put('/products/{product}', [ProductController::class, 'update'])->middleware('role:Manager');
    Route::delete('/products/{product}', [ProductController::class, 'destroy'])->middleware('role:Manager');

    // Categories
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store'])->middleware('role:Manager');
    Route::put('/categories/{category}', [CategoryController::class, 'update'])->middleware('role:Manager');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->middleware('role:Manager');

    // Tables
    Route::get('/tables', [TableController::class, 'index']);
    Route::post('/tables', [TableController::class, 'store'])->middleware('role:Manager');
    Route::put('/tables/{table}', [TableController::class, 'update']);
    Route::delete('/tables/{table}', [TableController::class, 'destroy'])->middleware('role:Manager');

    // Reservations
    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::post('/reservations', [ReservationController::class, 'store'])->middleware('role:Server,Manager');
    Route::put('/reservations/{reservation}', [ReservationController::class, 'update'])->middleware('role:Server,Manager');
    Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy'])->middleware('role:Manager');

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::post('/orders/{order}/transmit', [OrderController::class, 'transmit']);
    Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::get('/orders/kitchen', [OrderController::class, 'kitchenQueue']);
});
