#!/bin/bash

# DEPRECATED: server-setup.sh installs Apache/PHP directly — the project now uses a Docker Compose stack.
# Keep this script for historical reference only.
echo "ERROR: server-setup.sh is deprecated — use the Docker-based deployment (see README)." >&2
exit 1

# Portfolio Production Server Setup Script
# Run this on your DigitalOcean droplet after creation

echo "🚀 Starting Portfolio Server Setup..."

# Update system
echo "📦 Updating system..."
sudo apt update && sudo apt upgrade -y

# Install required software
echo "🔧 Installing Apache, PHP, SQLite..."
sudo apt install -y apache2 php php-sqlite3 php-mbstring php-xml php-curl unzip

# Install Composer for Laravel
echo "📥 Installing Composer..."
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Enable Apache modules
echo "⚙️ Configuring Apache..."
sudo a2enmod rewrite
sudo systemctl enable apache2
sudo systemctl start apache2

# Create portfolio directory
echo "📁 Creating portfolio directory..."
sudo mkdir -p /var/www/portfolio
sudo chown -R www-data:www-data /var/www/portfolio
sudo chmod -R 755 /var/www/portfolio

# Configure Apache virtual host
echo "🌐 Setting up Apache virtual host..."
sudo tee /etc/apache2/sites-available/portfolio.conf > /dev/null <<EOF
<VirtualHost *:80>
    ServerName _default_
    DocumentRoot /var/www/portfolio

    <Directory /var/www/portfolio>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/portfolio_error.log
    CustomLog \${APACHE_LOG_DIR}/portfolio_access.log combined
</VirtualHost>
EOF

# Enable site and disable default
sudo a2ensite portfolio.conf
sudo a2dissite 000-default.conf
sudo systemctl reload apache2

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Apache Full'
sudo ufw --force enable

# Create Laravel backend directory
echo "🎯 Setting up Laravel backend..."
sudo mkdir -p /var/www/portfolio/backend
sudo chown -R www-data:www-data /var/www/portfolio/backend

echo "✅ Server setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update deploy.sh with your droplet IP"
echo "2. Run deployment: ./deploy.sh prod"
echo "3. Access your portfolio at: http://YOUR_DROPLET_IP"
echo ""
echo "🔐 For security, consider:"
echo "- Setting up SSL with Let's Encrypt"
echo "- Adding SSH key authentication"
echo "- Regular backups"