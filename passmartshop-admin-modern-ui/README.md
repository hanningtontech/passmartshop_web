# Passmartshop Admin Dashboard - Modern UI

This folder contains the complete modern admin dashboard for Passmartshop with improved UI/UX design.

## What's Included

### Components
- **AdminLayout.tsx** - Modern sidebar navigation with gradient styling, responsive design, and professional appearance

### Pages
- **Dashboard.tsx** - Main admin overview with statistics cards, quick actions, and system status
- **Categories.tsx** - Category management with list view and CRUD operations
- **CategoryForm.tsx** - Add/Edit category form with validation
- **Products.tsx** - Product inventory management with search and filtering
- **SimpleProductForm.tsx** - Comprehensive product form with all fields
- **ProductTypes.tsx** - Product type management
- **ProductTypeFields.tsx** - Custom field management for product types
- **ImportExport.tsx** - Bulk import/export functionality

## Design Features

### Modern Styling
- **Dark Theme**: Navy/charcoal background (slate-950, slate-900, slate-800)
- **Accent Color**: Orange (#FF6B35) for highlights and CTAs
- **Gradients**: Subtle gradients on cards and backgrounds
- **Shadows**: Soft shadows for depth and hierarchy
- **Animations**: Smooth transitions and hover effects

### Component Improvements
- **Stat Cards**: Large numbers, icons, trend indicators
- **Sidebar Navigation**: Collapsible with active states, icons, and user info
- **Quick Action Cards**: Interactive cards with hover effects and icons
- **Status Indicators**: Animated green dots for system status
- **Form Inputs**: Better styling with focus states and validation
- **Tables**: Modern table design with hover effects

### Responsive Design
- Mobile-first approach
- Responsive grid layouts
- Collapsible sidebar for mobile
- Touch-friendly buttons and inputs

## Installation

1. **Copy AdminLayout.tsx** to `client/src/components/`
2. **Copy Admin folder** to `client/src/pages/`
3. **Update your App.tsx** to use the new admin routes
4. **Import AdminLayout** in your admin pages

## Usage

All admin pages are wrapped with `AdminLayout` component which provides:
- Sidebar navigation
- Header with branding
- User info and logout
- Responsive design

Example:
```tsx
import AdminLayout from "@/components/AdminLayout";

export default function AdminPage() {
  return (
    <AdminLayout>
      {/* Your page content */}
    </AdminLayout>
  );
}
```

## Color Scheme

- **Background**: `bg-slate-950`, `bg-slate-900`, `bg-slate-800`
- **Text**: `text-white`, `text-slate-400`, `text-slate-300`
- **Accent**: `orange-500`, `orange-400`
- **Status**: `green-500` (active), `red-500` (inactive)

## Features

✅ Modern dark theme with orange accents
✅ Responsive sidebar navigation
✅ Statistics dashboard with real-time data
✅ Quick action cards for common tasks
✅ System status monitoring
✅ Recent activity feed
✅ Product management (CRUD)
✅ Category management (CRUD)
✅ Product type management
✅ Import/Export functionality
✅ Form validation
✅ Search and filtering
✅ Mobile-responsive design

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Notes

- All components use Tailwind CSS 4 for styling
- Icons from lucide-react
- Forms use React Hook Form for validation
- Data fetching with tRPC
- Responsive design with mobile-first approach

---

Built with React 19, TypeScript, Tailwind CSS 4, and modern web standards.
