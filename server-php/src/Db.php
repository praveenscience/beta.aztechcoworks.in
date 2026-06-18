<?php
declare(strict_types=1);

namespace Aztech\MockServer;

final class Db
{
    private string $path;
    /** @var array<string, mixed> */
    private array $data;

    public function __construct(?string $path = null)
    {
        $this->path = $path ?? __DIR__ . '/../data/db.json';
        if (!is_dir(dirname($this->path))) {
            mkdir(dirname($this->path), 0775, true);
        }
        if (!is_file($this->path)) {
            $this->data = self::seed();
            $this->persist();
        } else {
            $raw = file_get_contents($this->path) ?: '{}';
            $decoded = json_decode($raw, true);
            $this->data = is_array($decoded) ? $decoded : self::seed();
        }
    }

    /** @return array<int, array<string, mixed>> */
    public function table(string $name): array
    {
        return $this->data[$name] ?? [];
    }

    /** @param array<int, array<string, mixed>> $rows */
    public function setTable(string $name, array $rows): void
    {
        $this->data[$name] = array_values($rows);
        $this->persist();
    }

    public function insert(string $name, array $row): array
    {
        $rows = $this->table($name);
        $rows[] = $row;
        $this->setTable($name, $rows);
        return $row;
    }

    private function persist(): void
    {
        file_put_contents(
            $this->path,
            json_encode($this->data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
            LOCK_EX,
        );
    }

    /** @return array<string, array<int, array<string, mixed>>> */
    private static function seed(): array
    {
        $now = date(DATE_ATOM);
        return [
            'branches' => [
                ['id' => 'br_rs_puram', 'slug' => 'rs-puram', 'name' => 'Aztech RS Puram',  'city' => 'Coimbatore', 'address' => '12 DB Road, RS Puram', 'seats' => 80,  'isActive' => true, 'createdAt' => $now],
                ['id' => 'br_peelamedu', 'slug' => 'peelamedu', 'name' => 'Aztech Peelamedu', 'city' => 'Coimbatore', 'address' => 'Avinashi Rd, Peelamedu', 'seats' => 120, 'isActive' => true, 'createdAt' => $now],
                ['id' => 'br_saibaba',  'slug' => 'saibaba-colony', 'name' => 'Aztech Saibaba Colony', 'city' => 'Coimbatore', 'address' => 'NSR Rd, Saibaba Colony', 'seats' => 60, 'isActive' => true, 'createdAt' => $now],
                ['id' => 'br_race_course', 'slug' => 'race-course', 'name' => 'Aztech Race Course', 'city' => 'Coimbatore', 'address' => 'Race Course Rd', 'seats' => 100, 'isActive' => true, 'createdAt' => $now],
                ['id' => 'br_gandhipuram', 'slug' => 'gandhipuram', 'name' => 'Aztech Gandhipuram', 'city' => 'Coimbatore', 'address' => '100ft Rd, Gandhipuram', 'seats' => 90, 'isActive' => true, 'createdAt' => $now],
            ],
            'plans' => [
                ['id' => 'pl_daypass',   'name' => 'Day Pass',          'seatType' => 'hotdesk',   'basePrice' => 499,  'gstPercent' => 18, 'features' => ['High-speed Wi-Fi', 'Coffee/Tea', '1 day access']],
                ['id' => 'pl_hotdesk',   'name' => 'Hot Desk Monthly',  'seatType' => 'hotdesk',   'basePrice' => 6999, 'gstPercent' => 18, 'features' => ['Any seat', 'Locker', 'Meeting room credits']],
                ['id' => 'pl_dedicated', 'name' => 'Dedicated Desk',    'seatType' => 'dedicated', 'basePrice' => 9999, 'gstPercent' => 18, 'features' => ['Reserved desk', '24x7 access', 'Meeting room credits']],
                ['id' => 'pl_cabin4',    'name' => 'Private Cabin (4)', 'seatType' => 'cabin',     'basePrice' => 34999,'gstPercent' => 18, 'features' => ['4-seat cabin', 'Branded signage', '24x7 access']],
                ['id' => 'pl_virtual',   'name' => 'Virtual Office',    'seatType' => 'virtual',   'basePrice' => 1999, 'gstPercent' => 18, 'features' => ['Business address', 'Mail handling', 'GST registration support']],
            ],
            'leads' => [
                ['id' => 'ld_1', 'name' => 'Karthik R',  'email' => 'karthik@example.com',  'phone' => '+91 90000 11111', 'source' => 'website', 'score' => 72, 'createdAt' => $now],
                ['id' => 'ld_2', 'name' => 'Divya S',    'email' => 'divya@example.com',    'phone' => '+91 90000 22222', 'source' => 'referral','score' => 88, 'createdAt' => $now],
                ['id' => 'ld_3', 'name' => 'Vignesh M',  'email' => 'vignesh@example.com',  'phone' => '+91 90000 33333', 'source' => 'walk-in', 'score' => 41, 'createdAt' => $now],
            ],
        ];
    }
}
