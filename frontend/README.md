# Carbon Emissions Compliance AI - Frontend

This is the frontend application for the Carbon Emissions Compliance AI platform, built with Next.js, TypeScript, and Tailwind CSS.

## Overview

The Carbon Emissions Compliance AI platform helps organizations monitor, analyze, and ensure compliance with carbon emissions standards. This frontend provides an intuitive user interface for interacting with the platform's features.

## Features

- **Dashboard**: Visualize carbon emissions data and compliance status
- **Document Upload**: Upload and process documents related to carbon emissions
- **Data Visualization**: Interactive charts and graphs using Recharts
- **Responsive Design**: Fully responsive UI built with Tailwind CSS
- **Theme Support**: Light and dark mode support via next-themes
- **PDF Processing**: View and analyze PDF documents

## Tech Stack

- **Framework**: [Next.js 13](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://github.com/colinhacks/zod) validation
- **PDF Processing**: [PDF.js](https://mozilla.github.io/pdf.js/) and [PDF-lib](https://pdf-lib.js.org/)
- **Charts**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Date Handling**: [date-fns](https://date-fns.org/) and [React Day Picker](https://react-day-picker.js.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd carbon-emissions-compliance-ai/frontend
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the frontend directory with the following variables:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001 # Backend API URL
   ```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
npm run build
# or
yarn build
```

### Starting Production Server

```bash
npm run start
# or
yarn start
```

## Project Structure

```
frontend/
├── app/                  # Next.js App Router
│   ├── dashboard/        # Dashboard pages
│   ├── shared/           # Shared components and utilities
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── dashboard/        # Dashboard-specific components
│   ├── ui/               # UI components
│   └── ...               # Other components
├── data/                 # Static data
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and libraries
├── public/               # Static assets
└── ...                   # Configuration files
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Submit a pull request

## License

[MIT](LICENSE)

## Contact

For questions or support, please contact the project maintainers. 