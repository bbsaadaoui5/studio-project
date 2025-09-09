# **App Name**: CampusConnect

## Core Features:

- User Authentication: Secure user authentication with role-based access control (Admin, Teacher, Student, Parent) with offline support. Data saved locally via IndexedDB when offline, synced automatically on reconnection.
- Collapsible Sidebar Navigation: A responsive and collapsible sidebar navigation with role-based menu items, including Dashboard, Academic Management, Student Management, Staff Management, Examination, Communication, Resources, Finance, and Settings.
- Dashboard Overview: A customizable dashboard providing an overview of key information, including a calendar, notifications, and quick access to relevant modules. The calendar component should summarize recent and upcoming announcements.
- Student Directory: A comprehensive student directory with search, filtering, and detailed student profiles.

## Style Guidelines:

- Primary color: Deep blue (#304FFE) to convey trust and professionalism.
- Background color: Light blue (#E3F2FD) to provide a clean and calm interface.
- Accent color: Orange (#FF9100) to highlight key actions and calls to action.
- Body and headline font: 'Inter' sans-serif font for a modern, neutral, and readable appearance. Use 'Inter' for both headlines and body.
- Use consistent and clear icons from a library like FontAwesome to represent different modules and actions.
- Implement a responsive layout using Tailwind CSS grid and flexbox to ensure optimal viewing across different devices.
- Use subtle transitions and animations to enhance user experience and provide visual feedback (e.g., when opening/closing the sidebar or loading data).