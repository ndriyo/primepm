## System Architecture & Key Technical Decisions

### Overall Architecture
We employ a **Next.js** monorepo approach where both frontend and backend logic coexist. Next.js handles:
- **API Routes** (serverless endpoints)  
- **SSR / SSG** for pages  
- **Dynamic Routing** for multi-tenant or single-tenant paths  

### Data Flow Pattern
1. **Browser** communicates via REST/GraphQL (or Next.js API routes) for fetching/submitting data.  
2. **Next.js Server** (API routes) connects directly to **Supabase PostgreSQL** to read/write data.  
3. **Supabase** manages hosting, user row-level policies (if used), and DB scaling.  

### Authentication Pattern
- **NextAuth (or custom)** integration with Google/Microsoft.  
- **Email/password**: hashed credentials stored in Supabase.  
- Session tokens managed via **HTTP-only cookies** or server session.  

### Multi-Tenancy
- **Tenant Identification**: Either subdomain-based or per-organization ID in the DB.  
- **Row-Level Security**: Potentially enforced by Supabase or Next.js middleware.  

### UI/UX Patterns
- **Tailwind CSS** for utility-first styling.  
- **21st dev** component library for standardized UI elements (buttons, modals, forms).  
- Reusable "Dashboard Layout" for each tenant's workspace.

### Layout System
- **Responsive Grid Layout**: Uses CSS Grid for main content organization
- **Collapsible Sidebar**: Toggle-able sidebar with persistence via localStorage
- **Context-based State Management**: SidebarContext provides sidebar state across components
- **CSS Variables**: Custom properties for layout dimensions and transitions
- **Mobile-First Approach**: Prioritizes mobile layout with progressive enhancement for larger screens
- **Content Adaptation**: Content areas dynamically adjust when sidebar is collapsed/expanded

### Key Considerations
- **Scalability**: Next.js serverless model handles concurrent requests gracefully.  
- **Performance**: SSR for SEO-critical pages; client-side rendering for dynamic dashboards.  
- **Security**: Strict role-based checks in Next.js API routes, plus Supabase rules.

### API Route Handler Patterns
- **Route Parameter Typing**: When creating API route handlers in Next.js App Router, use the Promise-based pattern:
  1. Promise-based params approach (required for App Router):
     ```typescript
     export async function GET(
       request: NextRequest, 
       { params }: { params: Promise<{ paramName: string }> }
     ) {
       // IMPORTANT: Await the params object before accessing properties
       const { paramName } = await params;
       // Handler logic
     }
     ```
  
  This pattern is necessary because in the App Router, dynamic route parameters are provided as a Promise that needs to be awaited before accessing the values.

  Always be consistent with this pattern across all API routes to avoid type errors and ensure proper route parameter handling.
- **Error Handling**: All API route handlers should include try/catch blocks with appropriate error responses.
- **Status Codes**: Use appropriate HTTP status codes (200, 400, 404, 500) with descriptive error messages.

---
