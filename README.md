# Home Ease - Admin & Operations Dashboard Frontend

A modern, responsive, and feature-rich administrative dashboard for the **Home Ease** on-demand home services platform. Built with **React 19**, **Vite**, and **Tailwind CSS**.

---

## 🚀 Overview

The **Home Ease Admin Portal** provides platform administrators, dispatchers, and support staff with complete control over daily operations, bookings, service provider lifecycle, customer accounts, financial analytics, and promotional campaigns.

---

## ✨ Features & Modules

- 📊 **Executive Dashboard & Analytics**: High-level KPIs, booking trends, revenue metrics, and interactive charts powered by Recharts.
- 📅 **Bookings Management**: Real-time tracking of service requests, status transitions (Scheduled, In-Progress, Completed, Cancelled), and dispute handling.
- 🗂️ **Service Catalog**: Dynamic management of service categories, sub-services, pricing, durations, and tier configurations.
- 👷 **Worker & Provider Lifecycle**: Worker directory, status toggles, skills, service zones, and performance metrics.
- 🆔 **KYC & Verification Hub**: Document inspection, identity verification, background check approvals/rejections.
- 👥 **Customer Management**: User directory, booking histories, contact information, and support logs.
- 🚚 **Dispatch & Live Operations**: Smart assignment and allocation of technicians to customer tasks.
- 💰 **Financials & Settlements**: Revenue breakdowns, platform commissions, worker payouts, and payment transaction logs.
- 📢 **Marketing & Promotions**: Dynamic hero banner management, promo codes, referral discounts, and campaign scheduling.
- 🔔 **Notifications & Alerts**: Broadcast push notifications, customer/worker alert blasts, and automated system triggers.
- ⚙️ **Platform Settings & Role-Based Auth**: Granular access control, security policies, and application configuration.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Linter**: [Oxlint](https://oxc.rs/)

---

## 📦 Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or higher recommended)
- **npm** or **yarn**

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lokesh21248/Home_Ease_Admin_Frontend.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

6. Preview production build:
   ```bash
   npm run preview
   ```

---

## 📁 Project Structure

```text
Home-ease_Admin/
├── public/              # Static assets
├── src/
│   ├── api/             # API clients & service endpoints
│   ├── assets/          # Icons, illustrations, and images
│   ├── components/      # Reusable UI components (Modals, Tables, Forms)
│   ├── constants/       # App constants, status badges, config values
│   ├── views/           # Admin modules & views
│   │   ├── Module01Auth.jsx
│   │   ├── Module02Dashboard.jsx
│   │   ├── Module02Bookings.jsx
│   │   ├── Module03KYC.jsx
│   │   ├── Module04Workers.jsx
│   │   ├── Module05Customers.jsx
│   │   ├── Module06Dispatch.jsx
│   │   ├── Module07Categories.jsx
│   │   ├── Module08SubServices.jsx
│   │   ├── Module09Financials.jsx
│   │   ├── Module10Banners.jsx
│   │   ├── Module11Promotions.jsx
│   │   ├── Module12Notifications.jsx
│   │   ├── Module13Settings.jsx
│   │   └── ModuleAnalytics.jsx
│   ├── App.jsx          # Main application layout & navigation
│   └── main.jsx         # App entry point
├── package.json
└── vite.config.js
```

---

## 📄 License

This project is proprietary and intended for internal administrative use of the Home Ease platform.
