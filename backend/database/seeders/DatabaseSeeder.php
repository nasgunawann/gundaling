<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\Table;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Reservation;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Andi Pratama',
                'role' => 'Server',
                'pin_hash' => Hash::make('1234'),
            ],
            [
                'name' => 'Siti Aminah',
                'role' => 'Server',
                'pin_hash' => Hash::make('1234'),
            ],
            [
                'name' => 'Budi Santoso',
                'role' => 'Server',
                'pin_hash' => Hash::make('1234'),
            ],
            [
                'name' => 'David Lee',
                'role' => 'Manager',
                'pin_hash' => Hash::make('1234'),
            ],
            [
                'name' => 'Chef Juna',
                'role' => 'Chef',
                'pin_hash' => Hash::make('1234'),
            ],
        ];

        foreach ($users as $u) {
            User::create($u);
        }

        $categories = [
            ['name' => 'Meals', 'sort_order' => 1],
            ['name' => 'Milk & Dairy', 'sort_order' => 2],
            ['name' => 'Coffee', 'sort_order' => 3],
            ['name' => 'Desserts', 'sort_order' => 4],
        ];

        $catModels = [];
        foreach ($categories as $c) {
            $catModels[$c['name']] = Category::create($c);
        }

        $products = [
            [
                'id' => 1,
                'name' => 'Truffle Tagliatelle',
                'price' => 260000,
                'category_id' => $catModels['Meals']->id,
                'image' => '/images/truffle_tagliatelle.png',
                'desc' => 'Handmade pasta tossed in premium shaved black truffle butter, finished with freshly grated dry-aged Parmigiano.',
                'badge' => 'Best Seller',
                'details' => ['temp' => 'HOT', 'time' => '12 min', 'calories' => '640 kcal'],
                'standards' => ['organicCert' => true, 'tempControlled' => true, 'allergenWarning' => false, 'garnishAdded' => true],
            ],
            [
                'id' => 2,
                'name' => 'Crispy Skin Salmon',
                'price' => 285000,
                'category_id' => $catModels['Meals']->id,
                'image' => '/images/crispy_skin_salmon.png',
                'desc' => 'Pan-seared Atlantic salmon on a bed of fresh garlic butter asparagus and creamy mashed mountain potatoes.',
                'badge' => 'Signature',
                'details' => ['temp' => 'HOT', 'time' => '15 min', 'calories' => '580 kcal'],
                'standards' => ['organicCert' => true, 'tempControlled' => true, 'allergenWarning' => false, 'garnishAdded' => false],
            ],
            [
                'id' => 3,
                'name' => 'Heirloom Tomato Salad',
                'price' => 160000,
                'category_id' => $catModels['Meals']->id,
                'image' => '/images/heirloom_tomato_salad.png',
                'desc' => 'Fresh heirloom garden tomatoes, artisan buffalo mozzarella, farm basil, drizzled in premium aged balsamic vinegar.',
                'badge' => 'Vegan',
                'details' => ['temp' => 'COLD', 'time' => '5 min', 'calories' => '220 kcal'],
                'standards' => ['organicCert' => true, 'tempControlled' => false, 'allergenWarning' => false, 'garnishAdded' => true],
            ],
            [
                'id' => 4,
                'name' => 'Fresh Gundaling Cow Milk',
                'price' => 65000,
                'category_id' => $catModels['Milk & Dairy']->id,
                'image' => '/images/gundaling_milk.png',
                'desc' => 'Organic raw milk harvested daily from our high-altitude Berastagi dairy farm, pasteurized and flash chilled.',
                'badge' => 'Farmstead Fresh',
                'details' => ['temp' => 'COLD', 'time' => '1 min', 'calories' => '150 kcal'],
                'standards' => ['organicCert' => true, 'tempControlled' => true, 'allergenWarning' => false, 'garnishAdded' => false],
            ],
            [
                'id' => 5,
                'name' => 'Single Origin Latte',
                'price' => 55000,
                'category_id' => $catModels['Coffee']->id,
                'image' => '/images/single_origin_latte.png',
                'desc' => 'Premium espresso pulled from organic Sumatra Mandheling beans, combined with steamed Gundaling farm milk.',
                'badge' => 'Artisan',
                'details' => ['temp' => 'HOT', 'time' => '3 min', 'calories' => '120 kcal'],
                'standards' => ['organicCert' => false, 'tempControlled' => true, 'allergenWarning' => false, 'garnishAdded' => true],
            ],
            [
                'id' => 6,
                'name' => 'Organic Strawberry Gelato',
                'price' => 85000,
                'category_id' => $catModels['Desserts']->id,
                'image' => '/images/strawberry_gelato.png',
                'desc' => 'High-altitude organic strawberries churned with fresh Gundaling farm pasteurized cow milk cream.',
                'badge' => 'Sold Out',
                'out_of_stock' => true,
                'details' => ['temp' => 'COLD', 'time' => '2 min', 'calories' => '180 kcal'],
                'standards' => ['organicCert' => true, 'tempControlled' => true, 'allergenWarning' => false, 'garnishAdded' => true],
            ],
        ];

        $prodModels = [];
        foreach ($products as $p) {
            $prodModels[$p['id']] = Product::create($p);
        }

        $tables = [
            ['id' => 1, 'name' => 'Table 01', 'seats' => 4, 'shape' => 'circle', 'pos_x' => 10, 'pos_y' => 15, 'status' => 'Available'],
            ['id' => 2, 'name' => 'Table 02', 'seats' => 2, 'shape' => 'square', 'pos_x' => 30, 'pos_y' => 15, 'status' => 'Reserved'],
            ['id' => 3, 'name' => 'Table 03', 'seats' => 4, 'shape' => 'square', 'pos_x' => 50, 'pos_y' => 15, 'status' => 'Occupied'],
            ['id' => 4, 'name' => 'Table 04', 'seats' => 4, 'shape' => 'square', 'pos_x' => 70, 'pos_y' => 15, 'status' => 'Occupied'],
            ['id' => 5, 'name' => 'Table 05', 'seats' => 6, 'shape' => 'rectangle', 'pos_x' => 10, 'pos_y' => 45, 'status' => 'Available'],
            ['id' => 6, 'name' => 'Table 06', 'seats' => 2, 'shape' => 'circle', 'pos_x' => 30, 'pos_y' => 45, 'status' => 'Available'],
            ['id' => 7, 'name' => 'Table 07', 'seats' => 8, 'shape' => 'rectangle', 'pos_x' => 50, 'pos_y' => 45, 'status' => 'Reserved'],
            ['id' => 8, 'name' => 'Table 08', 'seats' => 6, 'shape' => 'rectangle', 'pos_x' => 70, 'pos_y' => 45, 'status' => 'Occupied'],
            ['id' => 12, 'name' => 'Table 12', 'seats' => 4, 'shape' => 'circle', 'pos_x' => 90, 'pos_y' => 45, 'status' => 'Occupied'],
        ];

        $tableModels = [];
        foreach ($tables as $t) {
            $tableModels[$t['name']] = Table::create($t);
        }

        $reservations = [
            [
                'name' => 'Eleanor Vance',
                'phone' => '+62 811-2345-6789',
                'guests' => 4,
                'table_id' => $tableModels['Table 12']->id,
                'time' => now()->setHour(18)->setMinute(30)->setSecond(0),
                'status' => 'Seated',
            ],
            [
                'name' => 'Albert Cole',
                'phone' => '+62 812-9876-5432',
                'guests' => 2,
                'table_id' => $tableModels['Table 05']->id,
                'time' => now()->setHour(19)->setMinute(0)->setSecond(0),
                'status' => 'Confirmed',
            ],
            [
                'name' => 'Miriam Sterling',
                'phone' => '+62 813-4567-8901',
                'guests' => 6,
                'table_id' => $tableModels['Table 08']->id,
                'time' => now()->setHour(19)->setMinute(30)->setSecond(0),
                'status' => 'Confirmed',
            ],
            [
                'name' => 'Dr. Gregory House',
                'phone' => '+62 814-1111-2222',
                'guests' => 1,
                'table_id' => $tableModels['Table 03']->id,
                'time' => now()->setHour(20)->setMinute(0)->setSecond(0),
                'status' => 'Arrived',
            ],
        ];

        foreach ($reservations as $r) {
            Reservation::create($r);
        }

        $waiter = User::where('role', 'Server')->first();

        // Orders mapping to tableCarts
        $carts = [
            'Table 12' => [
                ['id' => 1, 'qty' => 2],
                ['id' => 2, 'qty' => 1],
                ['id' => 3, 'qty' => 1],
            ],
            'Table 04' => [
                ['id' => 3, 'qty' => 1],
                ['id' => 5, 'qty' => 2],
            ],
            'Table 03' => [
                ['id' => 2, 'qty' => 2],
                ['id' => 1, 'qty' => 1],
            ],
            'Table 08' => [
                ['id' => 1, 'qty' => 4],
                ['id' => 5, 'qty' => 4],
            ],
        ];

        foreach ($carts as $tableName => $items) {
            $table = $tableModels[$tableName];
            $orderTotal = 0;
            foreach ($items as $item) {
                $p = $prodModels[$item['id']];
                $orderTotal += $p->price * $item['qty'];
            }
            // Add 10% service charge as done in React code: cart.reduce(...) * 1.1
            $orderTotal = $orderTotal * 1.1;

            $order = Order::create([
                'table_id' => $table->id,
                'user_id' => $waiter->id,
                'status' => 'pending', // or served/occupied
                'total' => $orderTotal,
            ]);

            foreach ($items as $item) {
                $p = $prodModels[$item['id']];
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $p->id,
                    'qty' => $item['qty'],
                    'unit_price' => $p->price,
                    'sent' => true,
                ]);
            }
        }
    }
}
