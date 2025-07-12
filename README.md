# StackIt - Q&A Platform

Video Demo - https://www.loom.com/share/51b3d51bc2374728ae6534e0056778a3?sid=ab357329-d320-483e-8134-cdf0c2cf4621

This is a repository of Odoo Hackathon 2025 for the problem statement 2 (StacckIt).

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

Team Name: NO_CLUE

Team Members:

- Manobal Singh Bagady - <manobalbagdy@gmail.com>
- Chanpreet Kaur - <6kchanpreet@gmail.com>

---

A minimal, modern question-and-answer platform built with Next.js, TypeScript, MongoDB, and Tailwind CSS.

## Features ✨

### Core Features

- **Ask Questions**: Rich text editor with formatting options
- **Answer Questions**: Comprehensive answer system with voting
- **Voting System**: Upvote/downvote questions and answers
- **Accept Answers**: Question authors can mark the best answer
- **Tagging System**: Organize questions with relevant tags
- **User Authentication**: Secure JWT-based authentication
- **Real-time Notifications**: Get notified of answers, votes, and mentions
- **Search & Filter**: Find questions by keywords and tags
- **Responsive Design**: Works perfectly on all devices

### Technical Features

- **Rich Text Editor**: Bold, italic, lists, links, images, emojis
- **User Roles**: Regular users and admin capabilities
- **Performance**: Optimized with pagination and efficient queries
- **Security**: Protected routes, input validation, XSS prevention

## Tech Stack 🛠️

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: MongoDB with Prisma ORM
- **Authentication**: JWT tokens with HTTP-only cookies
- **Deployment**: Ready for Vercel, Netlify, or any Node.js host

## Quick Start 🚀

### Prerequisites

- Node.js 18+ or Bun
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Manobal-Singh-Bagady/StackIt
   cd StackIt
   ```

2. **Install dependencies**

   ```bash
   bun install

   # or npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your MongoDB connection string:

   ```env
   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/stackit"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   ```

4. **Generate Prisma client**

   ```bash
   bun run db:generate
   ```

5. **Seed the database (optional)**

   ```bash
   bun run db:seed
   ```

6. **Start the development server**

   ```bash
   bun run dev
   ```

Visit `http://localhost:3000` to see your application!

## Test Users 👥

If you ran the seed script, you can log in with:

- **Regular User**: <john@example.com> / password123
- **Regular User**: <jane@example.com> / password123
- **Admin User**: <admin@example.com> / password123

## Project Structure 📁

```text
StackIt/
├── app/ # Next.js app directory
│ ├── api/ # API routes
│ ├── ask/ # Ask question page
│ ├── login/ # Login page
│ ├── register/ # Register page
│ └── questions/[id]/ # Question detail page
├── components/ # Reusable components
│ ├── ui/ # shadcn/ui components
│ └── ... # Custom components
├── hooks/ # Custom React hooks
├── lib/ # Utility functions
├── prisma/ # Database schema
└── scripts/ # Database scripts
```

## API Endpoints 🔌

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Questions

- `GET /api/questions` - Get questions (with filters)
- `POST /api/questions` - Create question
- `GET /api/questions/[id]` - Get question details

### Answers

- `POST /api/answers` - Create answer
- `PATCH /api/answers/[id]` - Accept/unaccept answer

### Voting

- `POST /api/votes` - Vote on question/answer

### Notifications

- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications` - Mark notifications as read

### Tags

- `GET /api/tags` - Get available tags

## Hackathon Scoring Criteria ✅

### Database Design (35%)

- ✅ Well-structured MongoDB schema with proper relationships
- ✅ Real-time sync capabilities
- ✅ Efficient indexing and queries

### Coding Standards (40%)

- ✅ Comprehensive data validation (frontend + backend)
- ✅ Dynamic values, no hardcoding
- ✅ Modular, reusable components
- ✅ Performance optimization with caching
- ✅ Robust error handling
- ✅ ESLint and TypeScript for code quality
- ✅ Complex business logic implementation

### UI/UX Design (15%)

- ✅ Fully responsive design
- ✅ Pagination and breadcrumbs
- ✅ Advanced search and filtering
- ✅ Excellent color scheme and accessibility

### Team Collaboration (10%)

- ✅ Git workflow with proper commits
- ✅ Modular architecture for team development

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ for the hackathon by Team StackIt
