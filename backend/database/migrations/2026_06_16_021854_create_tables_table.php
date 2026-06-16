<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tables', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->integer('seats');
            $table->string('shape'); // 'circle', 'square', 'rectangle'
            $table->decimal('pos_x', 5, 2)->default(0);
            $table->decimal('pos_y', 5, 2)->default(0);
            $table->string('status')->default('Available'); // 'Available', 'Reserved', 'Occupied'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tables');
    }
};
