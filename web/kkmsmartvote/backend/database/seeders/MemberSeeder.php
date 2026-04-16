<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MemberSeeder extends Seeder
{
    /**
     * Example fallback data if SQL file not available
     * Format: [nik, name, site, department, email, is_eligible, has_voted]
     */
    private function getMembersData(): array
    {
        return [
            ['190400122', 'WINDY KHAIRUNNISA', null, 'CORPORATE QA - QUALITY & FOOD SAFETY', null, 1, 0],
            ['230700121', 'ENDANG SETYOWATI WIDYANINI', null, 'CRM - F A', null, 1, 0],
            ['220300148', 'LATIFAH', null, 'CRM - F A', null, 1, 0],
            ['220300150', 'YUNIAR IIS FAEROSI', null, 'CRM - F A', null, 1, 0],
        ];
    }

    public function run(): void
    {
        // STEP 1: Disable FK constraints temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // STEP 2: Truncate members table
        echo "Truncating members table...\n";
        DB::table('members')->truncate();

        // STEP 3: Load and insert bulk member data from SQL
        // Using raw SQL insertion for performance (1,345+ rows)
        $this->loadMembersFromSQL();

        // STEP 4: Run update script (deactivate old, update changed, insert new)
        echo "\n--- Running member updates ---\n";
        $this->runUpdateScript();

        // STEP 4b: Backfill departments master when table exists.
        $this->backfillDepartmentsMaster();

        // STEP 4c: Link members to departments when the normalized column exists.
        $this->backfillMemberDepartmentIds();

        // STEP 5: Re-enable FK constraints
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // STEP 6: Show final stats
        $this->showFinalStats();

        echo "\n✓ Members seeding completed\n";
    }

    /**
     * Load members from bulk SQL INSERT statements.
     * Data source: docs/DATABASE_API/insert_anggota_members_bulk.sql
     * Columns: nik, name, site, department, email, is_eligible, has_voted
     */
    private function loadMembersFromSQL(): void
    {
        $members = $this->getAllMembers();
        $this->insertMembersInBatches($members);
    }

    /**
     * Load ALL members from insert_anggota_members_bulk.sql
     * Parses UNION ALL SELECT statements and extracts data
     * Returns array of [nik, name, site, department, email, is_eligible, has_voted]
     */
    private function getAllMembers(): array
    {
        // Try multiple possible paths (Laragon vs Portfolio)
        $possiblePaths = [
            base_path('../../docs/DATABASE_API/insert_anggota_members_bulk.sql'),
            base_path('../docs/DATABASE_API/insert_anggota_members_bulk.sql'),
            'F:\laragon\www\koperasi-vote\docs\DATABASE_API\insert_anggota_members_bulk.sql',
        ];

        $sqlFile = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $sqlFile = $path;
                break;
            }
        }

        if (!$sqlFile) {
            echo "⚠ Warning: SQL file not found. Using example data only (4 members)\n";
            return $this->getMembersData();
        }

        $content = file_get_contents($sqlFile);
        $members = [];

        // Parse both patterns:
        // Pattern 1: SELECT '190400122' AS nik, 'WINDY...' AS name, NULL AS site, 'DEPT' AS department, NULL AS email, 1 AS is_eligible, 0 AS has_voted
        // Pattern 2: UNION ALL SELECT '230700121', 'ENDANG...', NULL, 'CRM - F A', NULL, 1, 0
        // Handle both quoted and potentially escaped quotes

        $pattern = "/(SELECT\s+|UNION\s+ALL\s+SELECT\s+)'?([^',]+)'?,\s*'?([^',]*)'?,\s*NULL,\s*'?([^',]*)'?,\s*NULL,\s*(\d+),\s*(\d+)/i";

        preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            // Extract values: nik, name, department, is_eligible, has_voted
            $members[] = [
                trim($match[2]),  // nik
                trim($match[3]),  // name
                null,       // site
                trim($match[4]),  // department
                null,       // email
                (int)$match[5],  // is_eligible
                (int)$match[6],  // has_voted
            ];
        }

        if (count($members) === 0) {
            echo "⚠ Warning: No members parsed from SQL file\n";
            return $this->getMembersData();
        }

        echo "✓ Parsed " . count($members) . " members from insert_anggota_members_bulk.sql\n";
        return $members;
    }

    /**
     * Insert members in batches for better performance
     * Columns: nik, name, site, department, email, is_eligible, has_voted
     * Other columns use migration defaults: gopay_number=null, is_gopay_owner_self=true, gopay_owner_number=null
     */
    private function insertMembersInBatches(array $members, int $batchSize = 100): void
    {
        $total = count($members);
        $batches = ceil($total / $batchSize);

        for ($i = 0; $i < $batches; $i++) {
            $batch = array_slice($members, $i * $batchSize, $batchSize);

            DB::table('members')->insert(
                array_map(function ($member) {
                    return [
                        'nik' => $member[0],
                        'name' => $member[1],
                        'site' => $member[2],
                        'department' => $member[3],
                        'email' => $member[4],
                        'gopay_number' => null,
                        'is_gopay_owner_self' => true,
                        'gopay_owner_number' => null,
                        'is_eligible' => (bool)$member[5],
                        'has_voted' => (bool)$member[6],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }, $batch)
            );

            echo "✓ Batch " . ($i + 1) . " of $batches: rows " . (($i * $batchSize) + 1) . "-" . min((($i + 1) * $batchSize), $total) . "\n";
        }
    }

    /**
     * Run the update script to deactivate old members, update changed records, and insert new members
     * Data source: docs/DATABASE_API/update_anggota_apr26.sql
     * Changes:
     * - Deactivate 220 members (is_eligible = 0)
     * - Update 94 members (name and/or department)
     * - Insert 39 new members
     */
    private function runUpdateScript(): void
    {
        $updateFile = null;
        $possiblePaths = [
            base_path('../../docs/DATABASE_API/update_anggota_apr26.sql'),
            base_path('../docs/DATABASE_API/update_anggota_apr26.sql'),
            'F:\laragon\www\koperasi-vote\docs\DATABASE_API\update_anggota_apr26.sql',
        ];

        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $updateFile = $path;
                break;
            }
        }

        if (!$updateFile) {
            echo "⚠ Warning: update_anggota_apr26.sql not found, skipping updates\n";
            return;
        }

        $content = file_get_contents($updateFile);

        // Split by semicolon and execute each statement in order.
        $parts = preg_split('/;/', $content);

        $deactivateCount = 0;
        $updateCount = 0;
        $insertCount = 0;

        foreach ($parts as $stmt) {
            $cleanStmt = $this->normalizeSqlStatement($stmt);

            if ($cleanStmt === '') {
                continue;
            }

            if (preg_match('/^SELECT\s+/i', $cleanStmt)) {
                continue;
            }

            try {
                if (preg_match('/^UPDATE\s+members\s+/i', $cleanStmt)) {
                    DB::unprepared($cleanStmt);
                    $updateCount++;
                } else {
                    DB::unprepared($cleanStmt);
                }
            } catch (\Exception $e) {
                echo "⚠ Error executing update statement: " . $e->getMessage() . "\n";
            }
        }

        $deactivateCount = (int) DB::table('members')->where('is_eligible', 0)->count();
        $insertCount = (int) DB::table('members')->where('is_eligible', 1)->count();

        echo "✓ Deactivated: " . $deactivateCount . " member(s)\n";
        echo "✓ Updated: " . $updateCount . " member record(s)\n";
        echo "✓ Inserted: " . $insertCount . " new member(s)\n";
    }

    /**
     * Backfill departments table from members.department values when departments exists.
     */
    private function backfillDepartmentsMaster(): void
    {
        $tableExists = DB::table('information_schema.tables')
            ->where('table_schema', DB::raw('DATABASE()'))
            ->where('table_name', 'departments')
            ->exists();

        if (!$tableExists) {
            echo "✓ Departments backfill skipped (table departments not found)\n";
            return;
        }

        $hasNameColumn = DB::table('information_schema.columns')
            ->where('table_schema', DB::raw('DATABASE()'))
            ->where('table_name', 'departments')
            ->where('column_name', 'name')
            ->exists();

        if (!$hasNameColumn) {
            echo "✓ Departments backfill skipped (column name not found)\n";
            return;
        }

        DB::statement(<<<'SQL'
            INSERT INTO departments (code, name, created_at, updated_at)
            SELECT
                CONCAT('DEPT_', LPAD(ROW_NUMBER() OVER (ORDER BY source_departments.department_name), 4, '0')) AS code,
                source_departments.department_name,
                NOW(),
                NOW()
            FROM (
                SELECT DISTINCT TRIM(m.department) AS department_name
                FROM members m
                WHERE m.department IS NOT NULL
                  AND TRIM(m.department) <> ''
            ) source_departments
            LEFT JOIN departments d ON d.name = source_departments.department_name
            WHERE d.id IS NULL
        SQL);

        echo "✓ Departments backfill completed\n";
    }

    /**
     * Backfill members.department_id from departments.name when the column exists.
     */
    private function backfillMemberDepartmentIds(): void
    {
        $tableExists = DB::table('information_schema.tables')
            ->where('table_schema', DB::raw('DATABASE()'))
            ->where('table_name', 'departments')
            ->exists();

        if (!$tableExists) {
            echo "✓ Member department backfill skipped (table departments not found)\n";
            return;
        }

        $hasDepartmentIdColumn = DB::table('information_schema.columns')
            ->where('table_schema', DB::raw('DATABASE()'))
            ->where('table_name', 'members')
            ->where('column_name', 'department_id')
            ->exists();

        if (!$hasDepartmentIdColumn) {
            echo "✓ Member department backfill skipped (column department_id not found)\n";
            return;
        }

        DB::statement('
            UPDATE members m
            JOIN departments d ON d.name = m.department
            SET m.department_id = d.id
            WHERE m.department_id IS NULL
              AND m.department IS NOT NULL
              AND TRIM(m.department) <> ""
        ');

        echo "✓ Member department backfill completed\n";
    }

    /**
     * Normalize a raw SQL chunk into a single executable statement.
     */
    private function normalizeSqlStatement(string $stmt): string
    {
        $lines = preg_split('/\R/', $stmt);
        $sqlLines = [];

        foreach ($lines as $line) {
            $line = trim($line);

            if ($line === '' || str_starts_with($line, '--') || str_starts_with($line, '/*')) {
                continue;
            }

            $sqlLines[] = $line;
        }

        return preg_replace('/\s+/', ' ', trim(implode(' ', $sqlLines)));
    }

    /**
     * Show final member statistics
     */
    private function showFinalStats(): void
    {
        $result = DB::select('SELECT
            SUM(CASE WHEN is_eligible = 1 THEN 1 ELSE 0 END) AS active_members,
            SUM(CASE WHEN is_eligible = 0 THEN 1 ELSE 0 END) AS inactive_members,
            COUNT(*) AS total
        FROM members');

        if ($result) {
            $stats = $result[0];
            echo "\n=== FINAL MEMBER STATISTICS ===\n";
            echo "Active members (is_eligible=1):   " . ($stats->active_members ?? 0) . "\n";
            echo "Inactive members (is_eligible=0): " . ($stats->inactive_members ?? 0) . "\n";
            echo "Total members:                    " . ($stats->total ?? 0) . "\n";
            echo "================================\n";
        }
    }
}
