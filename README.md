# TMS Portal - Admin Dashboard

A modern, feature-rich admin dashboard built with Next.js 14, ShadCN UI, and Redux Toolkit.

## Features

✅ **Authentication System**
- Login page with form validation
- JWT token management
- Protected routes
- Logout functionality

✅ **Dashboard**
- Overview statistics
- Recent activity feed
- Quick actions
- Responsive design

✅ **User Management**
- Complete CRUD operations
- Search and filter users
- Role-based access
- Modern table interface

✅ **State Management**
- Redux Toolkit for global state
- RTK Query for API calls
- Automatic caching and refetching
- Optimistic updates

✅ **Modern UI/UX**
- ShadCN UI components
- Dark mode support
- Responsive sidebar navigation
- Beautiful gradient accents
- Loading states and animations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI
- **State Management**: Redux Toolkit + RTK Query
- **Form Handling**: React Hook Form + Zod
- **Icons**: Lucide React

## Project Structure

```
tms-portal/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── users/         # User management page
│   │   │   ├── layout.tsx     # Dashboard layout with sidebar
│   │   │   └── page.tsx       # Dashboard home
│   │   ├── login/
│   │   │   └── page.tsx       # Login page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home (redirects to login)
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── header.tsx     # Top navigation bar
│   │   │   └── sidebar.tsx    # Sidebar navigation
│   │   ├── ui/                # ShadCN UI components
│   │   └── providers.tsx      # Redux provider
│   ├── store/
│   │   ├── features/
│   │   │   └── authSlice.ts   # Auth state management
│   │   ├── services/
│   │   │   ├── authApi.ts     # Auth API endpoints
│   │   │   └── userApi.ts     # User CRUD API endpoints
│   │   └── index.ts           # Store configuration
│   └── lib/
│       └── utils.ts           # Utility functions
├── .github/
│   └── copilot-instructions.md
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18.x or higher (recommended: 20.x+)
- npm or yarn

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

3. **Run the development server**:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Backend API Requirements

The frontend expects a Node.js backend API with the following endpoints:

### Authentication Endpoints

```typescript
POST /api/auth/login
Body: { email: string, password: string }
Response: { user: User, token: string }

POST /api/auth/register
Body: { email: string, password: string, name: string }
Response: { user: User, token: string }

GET /api/auth/me
Headers: { Authorization: Bearer <token> }
Response: { user: User }
```

### User Management Endpoints

```typescript
GET /api/users?page=1&limit=10
Headers: { Authorization: Bearer <token> }
Response: { users: User[], total: number }

GET /api/users/:id
Headers: { Authorization: Bearer <token> }
Response: { user: User }

POST /api/users
Headers: { Authorization: Bearer <token> }
Body: { email: string, name: string, password: string, role: string }
Response: { user: User }

PUT /api/users/:id
Headers: { Authorization: Bearer <token> }
Body: Partial<User>
Response: { user: User }

DELETE /api/users/:id
Headers: { Authorization: Bearer <token> }
Response: { message: string }
```

### User Type

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}
```

## Demo Credentials

For testing without a backend, the login page displays demo credentials:

- **Email**: admin@example.com
- **Password**: admin123

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features to Implement in Backend

When building your Node.js backend, implement:

1. **Authentication**:
   - JWT token generation and validation
   - Password hashing (bcrypt)
   - Token expiration handling
   - Refresh token mechanism

2. **User Management**:
   - CRUD operations for users
   - Pagination support
   - Search/filter functionality
   - Role-based access control

3. **Security**:
   - CORS configuration
   - Rate limiting
   - Input validation
   - SQL injection prevention

4. **Database**:
   - PostgreSQL, MySQL, or MongoDB
   - User schema with timestamps
   - Proper indexing

## Customization

### Adding New Pages

1. Create a new folder in `src/app/dashboard/`
2. Add a `page.tsx` file
3. Add the route to the sidebar in `src/components/dashboard/sidebar.tsx`

### Adding New API Endpoints

1. Create a new API slice in `src/store/services/`
2. Add it to the store in `src/store/index.ts`
3. Use the hooks in your components

### Styling

- Global styles: `src/app/globals.css`
- Tailwind config: `tailwind.config.ts`
- Component-specific styles: Use Tailwind utility classes

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3001/api` |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## Next Steps

1. **Build the Node.js Backend**:
   - Set up Express.js server
   - Implement authentication
   - Create user CRUD endpoints
   - Connect to database

2. **Enhance Features**:
   - Add more dashboard pages
   - Implement real-time notifications
   - Add file upload functionality
   - Create admin settings page

3. **Testing**:
   - Unit tests with Jest
   - Integration tests
   - E2E tests with Cypress

4. **Performance**:
   - Implement caching strategies
   - Optimize images
   - Code splitting
   - Lazy loading

---

Built with ❤️ using Next.js and ShadCN UI
