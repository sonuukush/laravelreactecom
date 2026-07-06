<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'type',
        'value',
        'min_order_value',
        'start_date',
        'end_date',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'value' => 'decimal:2',
        'min_order_value' => 'decimal:2',
    ];

    public function isValid($cartSubtotal = 0)
    {
        $now = now();
        return $this->is_active &&
               $this->start_date <= $now &&
               $this->end_date >= $now &&
               $cartSubtotal >= $this->min_order_value;
    }
}
