# E-Sphere | Next-Gen E-commerce Store (Laravel + React SPA)

A full-stack e-commerce website featuring a **Laravel 11 REST API** backend and a **ReactJS (Vite) SPA** frontend styled with a premium dark-theme glassmorphic interface (using **Tailwind CSS v4**).

---

## Features
- **Sanctum Authentication**: Token-based login, registration, profile updates, and password changes.
- **Hierarchical Categories & Brands**: Supports multi-level subcategories and brand associations.
- **Product Details & Variants**: Responsive galleries, specs grid, and variant picking (Size, Color) with price modifiers and stock checks.
- **Shopping Cart**: Merges guest cart items with logged-in user accounts upon sign-in.
- **Wizard Checkout**: Address book selection, coupon discounts (`WELCOME10`, `FLAT50`), dynamic tax/shipping calculations, stock deduction, and payment method choices (COD, mock Cards/UPI).
- **Order Tracking**: Visual stepper tracking order status (Placed → Confirmed → Shipped → Delivered).
- **Admin Dashboard Console**:
  - Analytics overview chart using **Recharts**.
  - Catalog management CRUD for products, variants, categories, and brands.
  - Review moderation (approval queue) and customer blocking mechanism.
  - Bulk upload products via CSV template.

---

## Tech Stack
- **Backend**: Laravel 11 (PHP 8.2), Spatie Permission (Roles & Permissions), Laravel Sanctum (APIs tokens).
- **Frontend**: ReactJS, Vite, Tailwind CSS v4, Redux Toolkit (State Management), Lucide Icons, Recharts (Sales graphs).
- **Database**: MySQL / MariaDB.

---

## Installation & Setup

### 1. Database Setup
1. Open your database manager (XAMPP MySQL) and create a database named `ecom_db`.

### 2. Backend Installation (Laravel)
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install Composer dependencies:
   ```bash
   composer install
   ```
3. Copy `.env.example` to `.env` and configure your database settings (Host, User, Port, Name).
4. Run migrations and seeders to populate database with default categories, products, and admin accounts:
   ```bash
   php artisan migrate --seed
   ```
5. Create storage symlink:
   ```bash
   php artisan storage:link
   ```
6. Start the API server:
   ```bash
   php artisan serve --port=8000
   ```

### 3. Frontend Installation (React SPA)
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install NPM packages:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

---

## Default Accounts to Test
- **Super Admin Panel**: `admin@ecom.com` / `password`
- **Customer Account**: `john@example.com` / `password`
