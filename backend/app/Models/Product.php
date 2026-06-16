<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'name',
    'price',
    'category_id',
    'image',
    'desc',
    'badge',
    'out_of_stock',
    'details',
    'standards',
    'active'
])]
class Product extends Model
{
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'out_of_stock' => 'boolean',
            'active' => 'boolean',
            'details' => 'array',
            'standards' => 'array',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
