FROM php:8.3-cli-alpine

RUN apk add --no-cache \
    git curl zip unzip \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-interaction --optimize-autoloader --no-dev 2>/dev/null || true

EXPOSE 8000
