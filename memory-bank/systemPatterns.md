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

### Key Considerations
- **Scalability**: Next.js serverless model handles concurrent requests gracefully.  
- **Performance**: SSR for SEO-critical pages; client-side rendering for dynamic dashboards.  
- **Security**: Strict role-based checks in Next.js API routes, plus Supabase rules.

---
