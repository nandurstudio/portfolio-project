# Web Static Files

This directory contains static frontend files served by Nginx:

## Structure

```
web/
├── index.html     # Main portfolio page
├── assets/        # CSS, JS, fonts
│   ├── css/
│   ├── js/
│   ├── bootstrap/
│   └── image/
├── kkmsmartvote/  # Smart Voting system (React frontend + Laravel backend)
└── koperasidesa/  # Koperasi Desa management system (React frontend + Laravel backend)
```

## Nginx Serving

Nginx container mounts this directory as:
```
volumes:
  - ./web:/var/www/html:ro
```

The `:ro` flag means read-only for security.

## Notes

- Static files only (HTML, CSS, JS, images)
- No server-side processing (except Laravel API via PHP-FPM)
- Laravel public assets mounted separately to `/var/www/laravel/public`
