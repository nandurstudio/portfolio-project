#!/bin/bash
#
# KKM Smart Vote - Testing & Deployment Script (Bash)
# Purpose: Automate database setup, migrations, seeding, and API testing
# Author: GitHub Copilot
# Date: April 6, 2026
# Usage: ./test-kkmsmartvote.sh [action] [options]
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
BACKEND_PATH="${BACKEND_PATH:-.}"
PORT="${PORT:-8000}"
ACTION="${1:-help}"

# Functions
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

show_help() {
    cat << EOF
${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}
${BLUE}║${NC}        KKM Smart Vote - Testing Script (Bash)
${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}

${YELLOW}USAGE:${NC}
  ./test-kkmsmartvote.sh [action] [options]

${YELLOW}ACTIONS:${NC}
  setup           - Setup environment & install dependencies
  migrate         - Run fresh migrations
  seed            - Seed database with test data
  serve           - Start Laravel dev server
  test-health     - Test API health endpoint
  test-election   - Test election endpoints
  test-candidates - Test candidate endpoints
  test-voting     - Test voting endpoints (OTP flow)
  test-stats      - Test statistics endpoints
  test-all        - Run all API tests
  clean           - Clean cache and temporary files
  reset           - Fresh start (migrate:fresh --seed)
  help            - Show this help message

${YELLOW}EXAMPLES:${NC}
  # Full setup
  ./test-kkmsmartvote.sh setup
  ./test-kkmsmartvote.sh migrate
  ./test-kkmsmartvote.sh seed

  # Run testing
  ./test-kkmsmartvote.sh test-all

  # Start server
  ./test-kkmsmartvote.sh serve

EOF
}

check_prerequisites() {
    print_info "Checking prerequisites..."

    # Check PHP
    if ! command -v php &> /dev/null; then
        print_error "PHP not found"
        exit 1
    fi
    php_version=$(php -v | head -n 1)
    print_success "PHP: $php_version"

    # Check Composer
    if ! command -v composer &> /dev/null; then
        print_error "Composer not found"
        exit 1
    fi
    composer_version=$(composer --version)
    print_success "Composer: $composer_version"

    # Check Laravel
    if [ ! -f "$BACKEND_PATH/artisan" ]; then
        print_error "Laravel not found at $BACKEND_PATH"
        exit 1
    fi
    print_success "Laravel: Found"
}

setup_environment() {
    print_header "SETUP: Installing Dependencies & Generating App Key"

    pushd "$BACKEND_PATH" > /dev/null

    # Copy .env if not exists
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_info "Creating .env from .env.example..."
            cp ".env.example" ".env"
        else
            print_warning "No .env.example found, creating minimal .env..."
            cat > .env << EOF
APP_NAME="KKM Smart Vote"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:$PORT

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kkmsmartvote
DB_USERNAME=root
DB_PASSWORD=

JWT_SECRET=your_jwt_secret_here
EOF
        fi
    fi

    # Generate App Key
    print_info "Generating APP_KEY..."
    php artisan key:generate --force

    # Composer install
    print_info "Installing Composer dependencies..."
    composer install --no-interaction

    popd > /dev/null
    print_success "Setup completed!"
}

run_migrations() {
    print_header "DATABASE: Running Migrations"

    pushd "$BACKEND_PATH" > /dev/null

    print_info "Running migrate:fresh..."
    php artisan migrate:fresh --force --no-interaction

    print_success "Migrations completed!"

    popd > /dev/null
}

seed_database() {
    print_header "DATABASE: Seeding Test Data"

    pushd "$BACKEND_PATH" > /dev/null

    print_info "Seeding database..."
    php artisan db:seed --class=DatabaseSeeder --force --no-interaction

    echo
    print_success "Test Data Created:"
    echo "  • 2 Sites (SITE_A, SITE_B)"
    echo "  • 4 Users (super_admin, 2x panitia, saksi_forensik)"
    echo "  • 1 Election setting"
    echo "  • 2 Candidates"
    echo "  • 4 Members (eligible voters)"

    popd > /dev/null
}

start_server() {
    print_header "SERVER: Starting Laravel Development Server"

    pushd "$BACKEND_PATH" > /dev/null

    print_info "Starting server on http://localhost:$PORT"
    print_warning "Press Ctrl+C to stop\n"

    php artisan serve --host=localhost --port=$PORT

    popd > /dev/null
}

test_health() {
    print_header "TEST: API Health Check"

    url="http://localhost:$PORT/api/test"
    print_info "GET $url"

    response=$(curl -s "$url")
    if [ $? -eq 0 ]; then
        print_success "Response:"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        print_error "Connection failed"
    fi
}

test_election() {
    print_header "TEST: Election Endpoints"

    # Get current election
    url="http://localhost:$PORT/api/election/current"
    print_info "1️⃣  GET $url"

    response=$(curl -s "$url")
    if [ $? -eq 0 ]; then
        print_success "Response:"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        print_error "Connection failed"
    fi
}

test_candidates() {
    print_header "TEST: Candidate Endpoints"

    url="http://localhost:$PORT/api/voting/candidates-with-details"
    print_info "1️⃣  GET $url"

    response=$(curl -s "$url")
    if [ $? -eq 0 ]; then
        count=$(echo "$response" | jq '.data | length' 2>/dev/null)
        print_success "Candidates Found: $count"
        echo "$response" | jq '.data[] | "  - #\(.order_display) \(.name) (\(.position))"' 2>/dev/null || echo "$response"
    else
        print_error "Connection failed"
    fi
}

test_stats() {
    print_header "TEST: Statistics Endpoints"

    # Voting progress
    url="http://localhost:$PORT/api/stats/voting-progress"
    print_info "1️⃣  GET $url"

    response=$(curl -s "$url")
    if [ $? -eq 0 ]; then
        print_success "Response:"
        echo "$response" | jq '.data' 2>/dev/null || echo "$response"
    else
        print_error "Connection failed"
    fi

    # Candidate votes
    url="http://localhost:$PORT/api/stats/candidate-votes"
    print_info "2️⃣  GET $url"

    response=$(curl -s "$url")
    if [ $? -eq 0 ]; then
        count=$(echo "$response" | jq '.data.candidates | length' 2>/dev/null)
        print_success "Candidates: $count"
    else
        print_error "Connection failed"
    fi
}

test_voting() {
    print_header "TEST: Voting Flow (OTP + Member Lookup)"

    # Request OTP
    url="http://localhost:$PORT/api/voting/request-otp"
    print_info "1️⃣  POST $url"

    response=$(curl -s -X POST "$url" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com"}')

    if [ $? -eq 0 ]; then
        print_success "OTP Requested"
        email=$(echo "$response" | jq -r '.data.masked_email' 2>/dev/null)
        expires=$(echo "$response" | jq -r '.data.expires_in' 2>/dev/null)
        echo "   Email: $email"
        echo "   Expires in: ${expires}s"
    else
        print_error "Connection failed"
    fi

    # Member lookup
    nik="190400122"
    url="http://localhost:$PORT/api/voting/member-lookup/$nik"
    print_info "2️⃣  GET $url"

    response=$(curl -s "$url")
    if [ $? -eq 0 ]; then
        print_success "Member Found:"
        name=$(echo "$response" | jq -r '.data.name' 2>/dev/null)
        dept=$(echo "$response" | jq -r '.data.department' 2>/dev/null)
        site=$(echo "$response" | jq -r '.data.site' 2>/dev/null)
        echo "   Name: $name"
        echo "   Department: $dept"
        echo "   Site: $site"
    else
        print_error "Connection failed"
    fi
}

test_all() {
    test_health
    echo
    test_election
    echo
    test_candidates
    echo
    test_stats
    echo
    test_voting
}

clean_cache() {
    print_header "CLEANUP: Clearing Cache & Temporary Files"

    pushd "$BACKEND_PATH" > /dev/null

    print_info "Clearing caches..."
    php artisan config:clear
    php artisan route:clear
    php artisan view:clear
    php artisan cache:clear

    print_success "Cache cleared!"

    popd > /dev/null
}

reset_database() {
    print_warning "This will reset the database!"
    read -p "Continue? (yes/no): " confirm

    if [ "$confirm" = "yes" ]; then
        run_migrations
        seed_database
        print_success "Database reset completed!"
    else
        print_error "Cancelled."
    fi
}

# Main execution
case "$ACTION" in
    setup)
        check_prerequisites
        setup_environment
        ;;
    migrate)
        run_migrations
        ;;
    seed)
        seed_database
        ;;
    serve)
        start_server
        ;;
    test-health)
        test_health
        ;;
    test-election)
        test_election
        ;;
    test-candidates)
        test_candidates
        ;;
    test-stats)
        test_stats
        ;;
    test-voting)
        test_voting
        ;;
    test-all)
        test_all
        ;;
    clean)
        clean_cache
        ;;
    reset)
        reset_database
        ;;
    help|*)
        show_help
        ;;
esac
