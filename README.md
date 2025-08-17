# AI Chat Assistant

A modern, real-time chat application with AI assistant integration built with Next.js, TypeScript, and GraphQL.

## ✨ Features

- **Real-time Chat**: Live messaging with GraphQL subscriptions
- **AI Integration**: Connected to n8n workflow for intelligent responses
- **Modern UI**: Beautiful interface with dark/light mode toggle
- **Authentication**: Secure user authentication with Nhost
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Smooth Animations**: Polished user experience with custom animations

## 🛠️ Tech Stack

- **Frontend**: Next.js 13.5.1 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Authentication**: Nhost (Backend-as-a-Service)
- **Database**: PostgreSQL via Nhost
- **GraphQL**: Apollo Client with subscriptions
- **AI Workflow**: n8n integration
- **UI Components**: Radix UI primitives

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Nhost account
- n8n instance (optional, for AI responses)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-chat-assistant.git
   cd ai-chat-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_NHOST_SUBDOMAIN=your-nhost-subdomain
   NEXT_PUBLIC_NHOST_REGION=your-nhost-region
   N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/send-message
   ```

4. **Database Setup**
   
   Set up your Nhost database with the following tables:
   
   **chats table:**
   ```sql
   CREATE TABLE chats (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title TEXT NOT NULL,
     user_id UUID NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
   
   **messages table:**
   ```sql
   CREATE TABLE messages (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
     content TEXT NOT NULL,
     sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Features Overview

### Authentication
- User registration and login
- Protected routes with auth guards
- Session management

### Chat Interface
- Create new chat conversations
- Real-time message delivery
- Message history persistence
- Typing indicators
- Smooth animations

### AI Integration
- n8n workflow integration
- Intelligent bot responses
- Error handling and fallbacks
- Rate limiting protection

### UI/UX
- Dark/light mode toggle
- Responsive design
- Custom animations
- Modern glassmorphism effects
- Accessible components

## 🔧 Configuration

### Nhost Setup
1. Create a new Nhost project
2. Set up authentication
3. Configure database permissions
4. Update environment variables

### n8n Workflow
The AI responses are powered by an n8n workflow that should:
1. Receive webhook with `{ chatId, content, userId }`
2. Process the message with your AI service
3. Return `{ success: true, botResponse: "AI response" }`

### GraphQL Schema
The app expects these GraphQL operations:
- Queries: `chats`, `messages`
- Mutations: `insert_chats_one`, `insert_messages_one`
- Subscriptions: `messages` (real-time updates)

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── chats/             # Chat interface
│   └── api/               # API routes
├── components/
│   ├── auth/              # Auth components
│   ├── chat/              # Chat components
│   ├── providers/         # Context providers
│   └── ui/                # shadcn/ui components
├── lib/                   # Utilities and configurations
│   ├── apollo.ts          # Apollo Client setup
│   ├── nhost.ts           # Nhost configuration
│   └── graphql/           # GraphQL queries/mutations
└── hooks/                 # Custom React hooks
```

## 🚀 Deployment

### Netlify (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/ai-chat-assistant.git
   git push -u origin main
   ```

2. **Deploy to Netlify**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Netlify will auto-detect Next.js settings

3. **Configure Environment Variables**
   In your Netlify dashboard, go to Site settings > Environment variables and add:
   ```
   NEXT_PUBLIC_NHOST_SUBDOMAIN=your-nhost-subdomain
   NEXT_PUBLIC_NHOST_REGION=your-nhost-region
   N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/send-message
   ```

4. **Deploy**
   - Netlify will automatically build and deploy your site
   - Your site will be available at `https://your-site-name.netlify.app`

### Other Platforms
The app can also be deployed to:
- Vercel
- Railway
- DigitalOcean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Nhost](https://nhost.io/) for backend services
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Apollo GraphQL](https://www.apollographql.com/) for data management

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

Built with ❤️ using modern web technologies