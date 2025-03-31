
# Project Documentation: CyberHand

## File Structure

The project follows a feature-based organization with clear separation of concerns:

```
src/
├── components/         # UI components organized by feature and type
│   ├── admin/          # Admin-specific components
│   ├── client/         # Client-specific components
│   ├── dashboard/      # Dashboard-related components
│   ├── invoices/       # Invoice-related components
│   ├── layout/         # Layout components like headers, shells
│   ├── leads/          # Lead management components
│   ├── navigation/     # Navigation-related components
│   ├── observer/       # Observer-specific components
│   ├── portfolio/      # Portfolio-related components
│   ├── reports/        # Reporting components
│   ├── staff/          # Staff-specific components
│   ├── ui/             # Reusable UI components (shadcn/ui based)
│   └── users/          # User management components
├── hooks/              # Custom React hooks
│   ├── staff/          # Staff-specific hooks
│   └── users/          # User-specific hooks
├── integrations/       # External integrations
│   └── supabase/       # Supabase client and related utilities
├── lib/                # Utility functions and helpers
├── pages/              # Page components organized by role/feature
│   ├── accounts/       # Account management pages
│   ├── admin/          # Admin pages
│   ├── client/         # Client pages
│   ├── dashboards/     # Dashboard pages for different roles
│   ├── documents/      # Document-related pages
│   ├── engagements/    # Engagement-related pages
│   ├── observer/       # Observer pages
│   ├── portfolio/      # Portfolio management pages
│   └── staff/          # Staff pages
└── types/              # TypeScript type definitions
```

## Code Structure

### Component Architecture

The application follows a hierarchical component structure:

1. **Page Components** - Top-level components that represent routes in the application
2. **Feature Components** - Components specific to a feature domain (e.g., ServiceRequestTable)
3. **Layout Components** - Components that define the structure of the UI (e.g., DashboardLayout)
4. **UI Components** - Reusable UI elements from shadcn/ui library

### State Management

- **Local Component State** - Using React's `useState` for component-specific state
- **Custom Hooks** - Encapsulating complex state logic and API calls
- **React Query** - For server state management with the `@tanstack/react-query` library

## Code Style

### TypeScript Usage

The project uses TypeScript throughout with:
- Strong typing for component props
- Interface definitions for domain models
- Type safety for API responses

### Component Patterns

- Functional components with hooks
- Props interfaces defined at the top of component files
- Destructured props with default values where appropriate

### CSS/Styling

- Tailwind CSS for styling
- Component-specific styles using Tailwind's utility classes
- Shadcn/ui components for consistent design language

## Code Architecture

### Routing

- React Router for navigation
- Role-based routing for different user types (admin, staff, client, observer)
- Protected routes based on authentication state

### Data Flow

1. **API Layer** - Supabase client for database operations
2. **Custom Hooks** - Abstract data fetching and mutation logic
3. **Components** - Consume hooks and render UI based on data state
4. **Error Handling** - Toast notifications for user feedback

### Authentication

- Supabase Auth for user authentication
- Role-based access control
- JWT tokens for maintaining session state

## Refactoring Opportunities

### Component Size Reduction

Several components exceed the recommended 50-100 lines of code:

- `ServiceRequestsPage.tsx` (270 lines)
- `ServiceRequestForm.tsx` (231 lines)
- `SidebarNav.tsx` (221 lines)

These should be refactored into smaller, focused components.

### Custom Hook Extraction

Some pages contain complex data fetching logic that could be extracted into custom hooks:

- Move data fetching logic from `ServiceRequestsPage.tsx` to a new `useServiceRequests` hook
- Create a `useServiceRequestForm` hook to handle form submission logic

### Type System Improvements

There are several TypeScript errors that need addressing, including:

- Mismatched types between backend and frontend models
- Inconsistent naming conventions (e.g., "CANCELED" vs "CANCELLED")
- Type instantiation issues in complex queries

### Code Duplication

There is duplication in:

- Table rendering logic across different tables
- Form validation patterns
- API error handling

### Performance Optimizations

- Implement pagination for large data sets
- Add memoization for expensive computations
- Optimize re-renders with React.memo and useMemo

## Development Practices

### Testing

Currently, the project lacks:
- Unit tests for components
- Integration tests for data flow
- End-to-end tests for critical user journeys

### Documentation

Areas that would benefit from better documentation:
- Component API documentation
- Business logic documentation
- User flow documentation

## Future Considerations

### Architectural Improvements

- Consider using a state management library for complex state
- Implement a more robust form library integration
- Develop a more comprehensive error handling strategy

### Feature Enhancements

- Add real-time updates for critical data
- Implement offline support for key features
- Create more interactive data visualizations

## Conclusion

The application has a solid foundation with clear organization, but would benefit from focused refactoring efforts to improve maintainability and performance. The modular structure allows for incremental improvements without requiring a complete rewrite.
