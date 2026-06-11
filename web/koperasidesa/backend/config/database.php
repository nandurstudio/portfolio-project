<?php
 
 return [
     'default' => env('KOPERASIDESA_DB_CONNECTION', env('DB_CONNECTION', 'mysql')),
 
     'connections' => [
         'mysql' => [
             'driver' => 'mysql',
             'url' => env('DATABASE_URL'),
             'host' => env('KOPERASIDESA_DB_HOST', env('DB_HOST', '127.0.0.1')),
             'port' => env('KOPERASIDESA_DB_PORT', env('DB_PORT', '3306')),
             'database' => env('KOPERASIDESA_DB_DATABASE', env('DB_DATABASE', 'db_koperasidesa')),
             'username' => env('KOPERASIDESA_DB_USERNAME', env('DB_USERNAME', 'root')),
             'password' => env('KOPERASIDESA_DB_PASSWORD', env('DB_PASSWORD', '')),
             'unix_socket' => env('KOPERASIDESA_DB_SOCKET', env('DB_SOCKET', '')),
             'charset' => 'utf8mb4',
             'collation' => 'utf8mb4_unicode_ci',
             'prefix' => '',
             'prefix_indexes' => true,
             'strict' => true,
             'engine' => null,
             'options' => extension_loaded('pdo_mysql') ? array_filter([
                 PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
             ]) : [],
         ],
 
         'pgsql' => [
             'driver' => 'pgsql',
             'url' => env('DATABASE_URL'),
             'host' => env('KOPERASIDESA_DB_HOST', env('DB_HOST', '127.0.0.1')),
             'port' => env('KOPERASIDESA_DB_PORT', env('DB_PORT', '5432')),
             'database' => env('KOPERASIDESA_DB_DATABASE', env('DB_DATABASE', 'db_koperasidesa')),
             'username' => env('KOPERASIDESA_DB_USERNAME', env('DB_USERNAME', 'koperasi')),
             'password' => env('KOPERASIDESA_DB_PASSWORD', env('DB_PASSWORD', '')),
             'charset' => 'utf8',
             'prefix' => '',
             'prefix_indexes' => true,
             'search_path' => 'public',
             'sslmode' => 'prefer',
         ],
     ],
 
     'migrations' => ['table' => 'migrations', 'update_date_on_publish' => true],
 ];
