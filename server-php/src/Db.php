<?php
declare(strict_types=1);

namespace Aztech;

use PDO;

final class Db
{
    public PDO $pdo;

    public function __construct(?string $path = null)
    {
        $path = $path ?? __DIR__ . '/../data/aztech.db';
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $this->pdo = new PDO("sqlite:$path", null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $this->pdo->exec('PRAGMA journal_mode = WAL');
        $this->pdo->exec('PRAGMA foreign_keys = ON');

        $this->createSchema();
        $this->migrate();
        $this->seedIfEmpty();
    }

    public function pdo(): PDO { return $this->pdo; }

    private function migrate(): void
    {
        // Add photos column to branches if missing
        $cols = $this->pdo->query("PRAGMA table_info(branches)")->fetchAll();
        $colNames = array_column($cols, 'name');
        if (!in_array('photos', $colNames, true)) {
            $this->pdo->exec("ALTER TABLE branches ADD COLUMN photos TEXT NOT NULL DEFAULT '[]'");
        }

        // Add coupon/discount columns to invoices if missing
        $invCols = $this->pdo->query("PRAGMA table_info(invoices)")->fetchAll();
        $invColNames = array_column($invCols, 'name');
        if (!in_array('couponId', $invColNames, true)) {
            $this->pdo->exec("ALTER TABLE invoices ADD COLUMN couponId TEXT");
            $this->pdo->exec("ALTER TABLE invoices ADD COLUMN discountAmount INTEGER NOT NULL DEFAULT 0");
        }
    }

    // ─── Schema ─────────────────────────────────

    private function createSchema(): void
    {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS branches (
                id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
                address TEXT NOT NULL, city TEXT NOT NULL, phone TEXT NOT NULL,
                hours TEXT NOT NULL, amenities TEXT NOT NULL DEFAULT '[]',
                totalSeats INTEGER NOT NULL, availableSeats INTEGER NOT NULL,
                isActive INTEGER NOT NULL DEFAULT 1, photo TEXT NOT NULL, description TEXT NOT NULL,
                photos TEXT NOT NULL DEFAULT '[]'
            );
            CREATE TABLE IF NOT EXISTS seat_inventory (
                branchId TEXT NOT NULL REFERENCES branches(id), type TEXT NOT NULL,
                total INTEGER NOT NULL, available INTEGER NOT NULL, monthlyPrice INTEGER NOT NULL,
                PRIMARY KEY (branchId, type)
            );
            CREATE TABLE IF NOT EXISTS meeting_rooms (
                id TEXT PRIMARY KEY, branchId TEXT NOT NULL REFERENCES branches(id),
                name TEXT NOT NULL, capacity INTEGER NOT NULL, hourlyPrice INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS plans (
                id TEXT PRIMARY KEY, name TEXT NOT NULL, seatType TEXT NOT NULL,
                basePrice INTEGER NOT NULL, gstRate INTEGER NOT NULL,
                description TEXT NOT NULL, features TEXT NOT NULL DEFAULT '[]'
            );
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
                phone TEXT, company TEXT, role TEXT NOT NULL, branchId TEXT,
                referralCode TEXT NOT NULL, passwordHash TEXT NOT NULL, createdAt TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS leads (
                id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'website', branchId TEXT, planId TEXT,
                teamSize INTEGER, budget INTEGER, timeline TEXT, message TEXT,
                score INTEGER NOT NULL DEFAULT 0, stage TEXT NOT NULL DEFAULT 'new',
                ownerId TEXT, customFields TEXT, createdAt TEXT NOT NULL, lostReason TEXT
            );
            CREATE TABLE IF NOT EXISTS lead_activities (
                id TEXT PRIMARY KEY, leadId TEXT NOT NULL REFERENCES leads(id),
                type TEXT NOT NULL, description TEXT NOT NULL, actorId TEXT, createdAt TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY, leadId TEXT, assigneeId TEXT NOT NULL,
                title TEXT NOT NULL, dueAt TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS site_visits (
                id TEXT PRIMARY KEY, leadId TEXT NOT NULL REFERENCES leads(id),
                branchId TEXT NOT NULL, scheduledAt TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'scheduled', mode TEXT NOT NULL DEFAULT 'self_serve'
            );
            CREATE TABLE IF NOT EXISTS memberships (
                id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id),
                planId TEXT NOT NULL, branchId TEXT NOT NULL, seats INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending', startDate TEXT NOT NULL, endDate TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS bookings (
                id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id),
                branchId TEXT NOT NULL, resourceType TEXT NOT NULL, resourceId TEXT NOT NULL,
                startAt TEXT NOT NULL, endAt TEXT NOT NULL, amount INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'confirmed'
            );
            CREATE TABLE IF NOT EXISTS invoices (
                id TEXT PRIMARY KEY, number TEXT UNIQUE NOT NULL,
                userId TEXT NOT NULL REFERENCES users(id), bookingId TEXT, membershipId TEXT,
                subtotal INTEGER NOT NULL, gst INTEGER NOT NULL, total INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending', issuedAt TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS visitors (
                id TEXT PRIMARY KEY, hostUserId TEXT NOT NULL REFERENCES users(id),
                branchId TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL,
                purpose TEXT NOT NULL, qrToken TEXT NOT NULL, expectedAt TEXT NOT NULL,
                checkedInAt TEXT, checkedOutAt TEXT
            );
            CREATE TABLE IF NOT EXISTS blog (
                id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
                excerpt TEXT NOT NULL, body TEXT NOT NULL, cover TEXT NOT NULL,
                publishedAt TEXT NOT NULL, author TEXT NOT NULL, tags TEXT NOT NULL DEFAULT '[]'
            );
            CREATE TABLE IF NOT EXISTS testimonials (
                id TEXT PRIMARY KEY, name TEXT NOT NULL, company TEXT NOT NULL,
                role TEXT NOT NULL, quote TEXT NOT NULL, avatar TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS coupons (
                id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                discountType TEXT NOT NULL DEFAULT 'percentage',
                discountValue INTEGER NOT NULL DEFAULT 0,
                maxDiscountAmount INTEGER,
                serviceScope TEXT NOT NULL DEFAULT 'all',
                allowedPlanIds TEXT NOT NULL DEFAULT '[]',
                allowedBranchIds TEXT NOT NULL DEFAULT '[]',
                allowedSeatTypes TEXT NOT NULL DEFAULT '[]',
                minOrderValue INTEGER NOT NULL DEFAULT 0,
                minDurationMonths INTEGER NOT NULL DEFAULT 0,
                firstPurchaseOnly INTEGER NOT NULL DEFAULT 0,
                maxUsesTotal INTEGER NOT NULL DEFAULT 0,
                maxUsesPerUser INTEGER NOT NULL DEFAULT 0,
                currentUsesTotal INTEGER NOT NULL DEFAULT 0,
                stackable INTEGER NOT NULL DEFAULT 0,
                isReferralCoupon INTEGER NOT NULL DEFAULT 0,
                validFrom TEXT NOT NULL,
                validUntil TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                createdBy TEXT NOT NULL,
                createdAt TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS coupon_usages (
                id TEXT PRIMARY KEY, couponId TEXT NOT NULL REFERENCES coupons(id),
                userId TEXT NOT NULL REFERENCES users(id), invoiceId TEXT NOT NULL,
                discountAmount INTEGER NOT NULL, appliedAt TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS user_deals (
                id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id),
                couponId TEXT NOT NULL REFERENCES coupons(id),
                status TEXT NOT NULL DEFAULT 'available',
                assignedBy TEXT NOT NULL, assignedAt TEXT NOT NULL,
                expiresAt TEXT, usedAt TEXT
            );
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                token TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id),
                expiresAt TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS payments (
                id TEXT PRIMARY KEY, orderId TEXT UNIQUE NOT NULL,
                razorpayPaymentId TEXT, razorpaySignature TEXT,
                invoiceId TEXT NOT NULL REFERENCES invoices(id),
                amount INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'created',
                createdAt TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT NOT NULL, action TEXT NOT NULL,
                entityType TEXT NOT NULL, entityId TEXT,
                detail TEXT, createdAt TEXT NOT NULL
            );
        ");
    }

    // ─── Seed ───────────────────────────────────

    private function seedIfEmpty(): void
    {
        $count = (int) $this->pdo->query("SELECT COUNT(*) FROM branches")->fetchColumn();
        if ($count > 0) return;

        $now = gmdate('c');
        $pw = password_hash('demo1234', PASSWORD_BCRYPT);

        $this->pdo->beginTransaction();

        $branches = [
            ['br_bk', 'brookfields', 'Aztech Brookfields', 'Dr Krishnasamy Mudaliyar Rd, Above Kailash Parbat, Brookefields, Sukrawar Pettai, R.S. Puram, Coimbatore, Tamil Nadu 641001', 'photo-1497366216548-37526070297c', 200, 60, 'The Aztech flagship at Brookfields Mall — large team operations, fully managed enterprise setups (20 to 150+ seaters), and premium corporate workstations.'],
            ['br_rs', 'rs-puram', 'Aztech RS Puram', '2nd Floor, Indsil House, E TV Swamy Road, RS Puram, Coimbatore, Tamil Nadu 641002', 'photo-1497366754035-f200968a6e72', 200, 65, 'Premium enterprise wings, custom executive suites, private cabins, and day-pass coworking at the heart of RS Puram.'],
            ['br_re', 'rs-puram-east', 'Aztech RS Puram East', '2nd Floor, 161 L, E Ponnurangam Road (East), RS Puram, Coimbatore, Tamil Nadu 641002', 'photo-1556761175-5973dc0f32e7', 200, 80, 'Ideal for freelancers, startups, back-office operations, training centers, and virtual office rentals.'],
            ['br_rn', 'ram-nagar', 'Aztech Ram Nagar', 'Near Vivekananda Road, Ram Nagar, Coimbatore', 'photo-1604328698692-f76ea9498e76', 200, 75, '24/7 access hub with digital door codes — work on your schedule, any time of day or night.'],
            ['br_at', 'att-colony', 'Aztech ATT Colony', 'Aztech Elysium Towers, ATT Colony, Coimbatore', 'photo-1568992687947-868a62a9f521', 200, 70, 'Modern tech-startup floors and corporate satellite offices in the vibrant ATT Colony neighborhood.'],
            ['br_sb', 'saibaba-colony', 'Aztech Saibaba Colony', 'Aztech Sanhasa Square, Saibaba Colony, Coimbatore', 'photo-1555396273-367ea4eb4db5', 200, 65, 'High-density scale-up teams and private corporate cabins at Sanhasa Square.'],
        ];

        $amenities = json_encode(["High-speed Wi-Fi (1 Gbps)","Power backup","Cafeteria","Premium coffee","Meeting rooms","24/7 access","Reception & mail handling","Printing & scanning","Phone booths","Lockers"]);

        $brStmt = $this->pdo->prepare("INSERT INTO branches (id,slug,name,address,city,phone,hours,amenities,totalSeats,availableSeats,isActive,photo,description) VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?)");
        $siStmt = $this->pdo->prepare("INSERT INTO seat_inventory (branchId,type,total,available,monthlyPrice) VALUES (?,?,?,?,?)");
        $mrStmt = $this->pdo->prepare("INSERT INTO meeting_rooms (id,branchId,name,capacity,hourlyPrice) VALUES (?,?,?,?,?)");

        foreach ($branches as $i => [$id, $slug, $name, $address, $photo, $total, $avail, $description]) {
            $hours = $id === 'br_rn' ? '24/7 · Digital access codes' : 'Mon–Sat · 8:00 AM – 10:00 PM';
            $brStmt->execute([$id, $slug, $name, $address, 'Coimbatore', '+91 83106 96307', $hours, $amenities, $total, $avail, $photo, $description]);

            $siStmt->execute([$id, 'hot_desk', 80, 30, 6500]);
            $siStmt->execute([$id, 'dedicated', 90, 25, 8500]);
            $siStmt->execute([$id, 'cabin', 40, 15, 18000]);
            $siStmt->execute([$id, 'team_office', 30, 10, 45000]);
            $siStmt->execute([$id, 'enterprise', 4, 2, 150000]);

            $mrStmt->execute(["mr_{$i}_a", $id, 'Boardroom A', 12, 800]);
            $mrStmt->execute(["mr_{$i}_b", $id, 'Huddle Room', 4, 400]);
            $mrStmt->execute(["mr_{$i}_c", $id, 'Conference Hall', 24, 1500]);
        }

        $plStmt = $this->pdo->prepare("INSERT INTO plans (id,name,seatType,basePrice,gstRate,description,features) VALUES (?,?,?,?,?,?,?)");
        $plStmt->execute(['pl_hot', 'Hot Desk', 'hot_desk', 6500, 18, 'Flexible desks, any branch, available daily.', json_encode(["Any open desk","All amenities","Meeting room credits (4 hrs/mo)","Community access"])]);
        $plStmt->execute(['pl_ded', 'Dedicated Desk', 'dedicated', 8500, 18, 'Your own desk, 24/7 access, locker included.', json_encode(["Reserved desk","24/7 access","Lockable storage","Meeting room credits (8 hrs/mo)"])]);
        $plStmt->execute(['pl_cab', 'Private Cabin', 'cabin', 18000, 18, 'Lockable private cabin for individuals or pairs.', json_encode(["Lockable cabin","2 desks","Premium chairs","Meeting room credits (16 hrs/mo)"])]);
        $plStmt->execute(['pl_team', 'Team Office', 'team_office', 45000, 18, 'Private office for 4–20 person teams. Fully managed.', json_encode(["Custom build-out","Dedicated reception","Unlimited meeting rooms","Enterprise SLAs"])]);
        $plStmt->execute(['pl_ent', 'Managed Enterprise Floor', 'enterprise', 150000, 18, 'Fully managed floors for 30–150+ person teams. Custom build-outs with annual lock-in contracts.', json_encode(["Custom build-out","White-labeled dashboard","Hybrid workforce tracking","Dedicated reception","Enterprise SLAs","Audit-ready compliance"])]);

        $uStmt = $this->pdo->prepare("INSERT INTO users (id,name,email,phone,company,role,branchId,referralCode,passwordHash,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)");
        $uStmt->execute(['u_super', 'Aarav Kumar', 'admin@aztechcoworks.in', '+91 83106 96307', null, 'super_admin', null, 'AARAV-VIP', $pw, $now]);
        $uStmt->execute(['u_sales', 'Divya Iyer', 'sales@aztechcoworks.in', null, null, 'sales_exec', null, 'DIVYA-100', $pw, $now]);
        $uStmt->execute(['u_smgr', 'Rohit Pillai', 'salesmgr@aztechcoworks.in', null, null, 'sales_manager', null, 'ROHIT-200', $pw, $now]);
        $uStmt->execute(['u_rec', 'Meera Sundar', 'reception@aztechcoworks.in', null, null, 'reception', 'br_bk', 'MEERA-300', $pw, $now]);
        $uStmt->execute(['u_brm', 'Karthik Raja', 'branchmgr@aztechcoworks.in', null, null, 'branch_manager', 'br_bk', 'KARTHIK-400', $pw, $now]);
        $uStmt->execute(['u_fin', 'Sneha Nair', 'finance@aztechcoworks.in', null, null, 'finance', null, 'SNEHA-500', $pw, $now]);
        $uStmt->execute(['u_mkt', 'Vikram Joshi', 'marketing@aztechcoworks.in', null, null, 'marketing', null, 'VIKRAM-600', $pw, $now]);
        $uStmt->execute(['u_member', 'Anjali Menon', 'anjali@cibylstudios.com', '+91 98765 43210', 'Cibyl Studios', 'member', 'br_rs', 'ANJALI-CW', $pw, $now]);

        $ldStmt = $this->pdo->prepare("INSERT INTO leads (id,name,email,phone,source,branchId,planId,teamSize,budget,timeline,message,score,stage,ownerId,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        $ldStmt->execute(['ld1','Suresh Babu','suresh@orangefin.in','+91 99887 76655','website','br_sb','pl_team',12,60000,'1_month','Looking for a team office for our fintech.',86,'qualified','u_sales',$now]);
        $ldStmt->execute(['ld2','Priya Ramesh','priya@studiokin.co','+91 90000 23456','website','br_rs','pl_ded',3,25000,'immediate',null,78,'site_visit','u_sales',$now]);
        $ldStmt->execute(['ld3','Manoj K','manoj@indigocode.dev','+91 90000 99887','whatsapp','br_rn','pl_hot',1,7000,'immediate',null,64,'new',null,$now]);

        $tkStmt = $this->pdo->prepare("INSERT INTO tasks (id,leadId,assigneeId,title,dueAt,done) VALUES (?,?,?,?,?,0)");
        $tkStmt->execute(['tk1','ld1','u_sales','Send proposal to Suresh', gmdate('c', time()+86400)]);
        $tkStmt->execute(['tk2','ld2','u_sales','Confirm site visit slot', gmdate('c', time()+14400)]);

        $this->pdo->prepare("INSERT INTO site_visits (id,leadId,branchId,scheduledAt,status,mode) VALUES (?,?,?,?,?,?)")
            ->execute(['sv1','ld2','br_rs', gmdate('c', time()+86400), 'scheduled', 'self_serve']);

        $this->pdo->prepare("INSERT INTO memberships (id,userId,planId,branchId,seats,status,startDate,endDate) VALUES (?,?,?,?,?,?,?,?)")
            ->execute(['mb1','u_member','pl_ded','br_rs',1,'active','2026-01-15','2026-07-15']);

        $invStmt = $this->pdo->prepare("INSERT INTO invoices (id,number,userId,membershipId,subtotal,gst,total,status,issuedAt) VALUES (?,?,?,?,?,?,?,?,?)");
        $invStmt->execute(['inv1','AZTECH-2026-0001','u_member','mb1',8500,1530,10030,'paid','2026-06-01']);
        $invStmt->execute(['inv2','AZTECH-2026-0002','u_member','mb1',8500,1530,10030,'paid','2026-05-01']);

        $bpStmt = $this->pdo->prepare("INSERT INTO blog (id,slug,title,excerpt,body,cover,publishedAt,author,tags) VALUES (?,?,?,?,?,?,?,?,?)");
        $bpStmt->execute(['bp1','best-coworking-space-in-coimbatore','The Best Coworking Space in Coimbatore (2026 Guide)','A founder\'s guide to picking a workspace in Coimbatore.','Coimbatore\'s tech corridor has exploded over the last 36 months...','photo-1497366216548-37526070297c','2026-05-22','Aztech Editorial',json_encode(['coimbatore','coworking','guide'])]);
        $bpStmt->execute(['bp2','office-space-vs-coworking','Office Space vs Coworking: What\'s right for your startup?','A break-even calculation, plus the soft factors most founders miss.','When you cross 8 people, the math changes...','photo-1604328698692-f76ea9498e76','2026-05-08','Aztech Editorial',json_encode(['startups','decisions'])]);
        $bpStmt->execute(['bp3','startup-workspace-guide','The Startup Workspace Guide','How your workspace needs change as you grow.','Every stage has different workspace needs...','photo-1568992687947-868a62a9f521','2026-04-19','Aztech Editorial',json_encode(['startups','growth'])]);

        $tStmt = $this->pdo->prepare("INSERT INTO testimonials (id,name,company,role,quote,avatar) VALUES (?,?,?,?,?,?)");
        $tStmt->execute(['t1','Karthik Subramaniam','Loop Analytics','Founder & CEO','Aztech let us scale from 3 to 22 people without ever moving offices.','photo-1500648767791-00dcc994a43e']);
        $tStmt->execute(['t2','Anjali Menon','Cibyl Studios','Design Lead','The community is real. We\'ve hired two engineers from coffee chats in the lounge.','photo-1438761681033-6461ffad8d80']);
        $tStmt->execute(['t3','Vignesh Raghavan','Northwind Labs','CTO','Best workspace in Coimbatore, hands down.','photo-1472099645785-5658abf4ff4e']);

        // Seed coupons
        $cpStmt = $this->pdo->prepare("INSERT INTO coupons (id,code,description,discountType,discountValue,maxDiscountAmount,serviceScope,allowedPlanIds,allowedBranchIds,allowedSeatTypes,minOrderValue,minDurationMonths,firstPurchaseOnly,maxUsesTotal,maxUsesPerUser,currentUsesTotal,stackable,isReferralCoupon,validFrom,validUntil,status,createdBy,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?,?,?)");
        $cpStmt->execute(['cp_launch','LAUNCH26','Launch offer — 15% off everything','percentage',15,2000,'all','[]','[]','[]',0,0,0,100,1,0,0,$now,'2026-12-31','active','u_super',$now]);
        $cpStmt->execute(['cp_hotdesk','HOTDESK500','₹500 off Hot Desk plan','flat',500,null,'membership','["pl_hot"]','[]','[]',0,0,0,0,1,0,0,$now,'2027-12-31','active','u_super',$now]);
        $cpStmt->execute(['cp_trial','FREETRIAL7','7 free days on first membership','free_days',7,null,'membership','[]','[]','[]',0,0,1,200,1,0,0,$now,'2027-06-30','active','u_super',$now]);

        // Seed user deals (assign deals to demo member)
        $dealStmt = $this->pdo->prepare("INSERT INTO user_deals (id,userId,couponId,status,assignedBy,assignedAt,expiresAt) VALUES (?,?,?,?,?,?,?)");
        $dealStmt->execute(['ud_1','u_member','cp_launch','available','u_super',$now,'2026-12-31']);
        $dealStmt->execute(['ud_2','u_member','cp_hotdesk','available','u_super',$now,'2027-12-31']);

        $this->pdo->commit();
    }

    // ─── Query helpers ──────────────────────────

    public function uid(string $prefix): string
    {
        return $prefix . '_' . bin2hex(random_bytes(4));
    }

    public function hashPassword(string $plain): string
    {
        return password_hash($plain, PASSWORD_BCRYPT);
    }

    public function verifyPassword(string $plain, string $hash): bool
    {
        // Support legacy SHA-256 hashes from old seed data
        if (strlen($hash) === 64 && !str_starts_with($hash, '$2')) {
            return hash_equals($hash, hash('sha256', $plain));
        }
        return password_verify($plain, $hash);
    }

    /** @return list<array<string,mixed>> */
    public function all(string $table): array
    {
        return $this->decodeRows($table, $this->pdo->query("SELECT * FROM $table")->fetchAll());
    }

    /** @return ?array<string,mixed> */
    public function find(string $table, string $id): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM $table WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $this->decodeRow($table, $row) : null;
    }

    /** @return ?array<string,mixed> */
    public function findBy(string $table, string $col, string $val): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM $table WHERE $col = ?");
        $stmt->execute([$val]);
        $row = $stmt->fetch();
        return $row ? $this->decodeRow($table, $row) : null;
    }

    /** @return list<array<string,mixed>> */
    public function where(string $table, string $col, string $val): array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM $table WHERE $col = ?");
        $stmt->execute([$val]);
        return $this->decodeRows($table, $stmt->fetchAll());
    }

    /** @param array<string,mixed> $data */
    public function insert(string $table, array $data): void
    {
        $data = $this->encodeRow($table, $data);
        $cols = implode(',', array_keys($data));
        $placeholders = implode(',', array_fill(0, count($data), '?'));
        $stmt = $this->pdo->prepare("INSERT OR REPLACE INTO $table ($cols) VALUES ($placeholders)");
        $stmt->execute(array_values($data));
    }

    /** @param array<string,mixed> $patch */
    public function update(string $table, string $id, array $patch): void
    {
        unset($patch['id']);
        if (empty($patch)) return;
        $patch = $this->encodeRow($table, $patch);
        $sets = implode(', ', array_map(fn($k) => "$k = ?", array_keys($patch)));
        $stmt = $this->pdo->prepare("UPDATE $table SET $sets WHERE id = ?");
        $stmt->execute([...array_values($patch), $id]);
    }

    public function delete(string $table, string $id): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM $table WHERE id = ?");
        $stmt->execute([$id]);
    }

    public function deleteBy(string $table, string $col, string $val): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM $table WHERE $col = ?");
        $stmt->execute([$val]);
    }

    public function count(string $table): int
    {
        return (int) $this->pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn();
    }

    /** Check for overlapping bookings on a resource */
    public function hasBookingConflict(string $resourceId, string $startAt, string $endAt): bool
    {
        $stmt = $this->pdo->prepare(
            "SELECT id FROM bookings WHERE resourceId = ? AND status = 'confirmed' AND startAt < ? AND endAt > ?"
        );
        $stmt->execute([$resourceId, $endAt, $startAt]);
        return (bool) $stmt->fetch();
    }

    /** Insert an audit log entry */
    public function insertAuditLog(string $userId, string $action, string $entityType, ?string $entityId = null, ?string $detail = null): void
    {
        $stmt = $this->pdo->prepare("INSERT INTO audit_logs (userId, action, entityType, entityId, detail, createdAt) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $action, $entityType, $entityId, $detail, gmdate('c')]);
    }

    /** Get recent audit logs */
    public function auditLogs(int $limit = 500): array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }

    // ─── JSON & boolean encoding ────────────────

    private const JSON_COLS = [
        'amenities' => true, 'features' => true, 'tags' => true, 'customFields' => true, 'photos' => true,
        'allowedPlanIds' => true, 'allowedBranchIds' => true, 'allowedSeatTypes' => true,
    ];

    private const BOOL_COLS = [
        'isActive' => true, 'done' => true,
        'firstPurchaseOnly' => true, 'stackable' => true, 'isReferralCoupon' => true,
    ];

    /** @param array<string,mixed> $row */
    private function decodeRow(string $table, array $row): array
    {
        foreach (self::JSON_COLS as $col => $_) {
            if (isset($row[$col]) && is_string($row[$col])) {
                $row[$col] = json_decode($row[$col], true) ?? $row[$col];
            }
        }
        foreach (self::BOOL_COLS as $col => $_) {
            if (array_key_exists($col, $row)) {
                $row[$col] = (bool) $row[$col];
            }
        }
        return $row;
    }

    /** @param list<array<string,mixed>> $rows */
    private function decodeRows(string $table, array $rows): array
    {
        return array_map(fn($r) => $this->decodeRow($table, $r), $rows);
    }

    /** @param array<string,mixed> $row */
    private function encodeRow(string $table, array $row): array
    {
        foreach (self::JSON_COLS as $col => $_) {
            if (isset($row[$col]) && is_array($row[$col])) {
                $row[$col] = json_encode($row[$col], JSON_UNESCAPED_SLASHES);
            }
        }
        foreach (self::BOOL_COLS as $col => $_) {
            if (array_key_exists($col, $row)) {
                $row[$col] = $row[$col] ? 1 : 0;
            }
        }
        return $row;
    }

    /** Strip passwordHash from user row */
    public function safeUser(array $user): array
    {
        unset($user['passwordHash']);
        return $user;
    }
}
