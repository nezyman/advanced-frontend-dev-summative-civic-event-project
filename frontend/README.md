# CivicEvents+ Frontend

A multi-page civic events web app built with HTML, Tailwind CSS (CDN) and jQuery only. It talks to the CivicEvents backend (Node/Express + PostgreSQL).

## Features

- Authentication: signup with live password strength meter, login, remember me, token sent as a Bearer header, automatic sign-out when the token expires or the server answers 401
- Roles: administrator and user, enforced in the UI at page, navigation, data and action level
- Global layout: logo, global search, navigation, notification bell with drawer, profile dropdown, admin menu, footer
- Events: list with keyword, location, date and status filters, pagination, detail page, register and cancel, admin registrants list, ratings and feedback, create and edit with image preview and upload progress
- Announcements: audio list, custom accessible audio player, create
- Promos: video list with lazy-loaded thumbnails, player with captions and transcript, create and edit
- Notifications: inbox, detail view, mark read and unread, admin delete
- Admin: dashboard with live charts, user management (enable or disable, no role changes), notifications management
- Profile and My registrations pages
- Accessibility: skip link, labelled controls, focus management in modals and drawer, keyboard support, live regions
- Performance: skeleton loaders, optimistic UI with rollback, session caching of promos, lazy loading

## Backend

The frontend expects the backend API at:

```
http://localhost:4000/api
```

To use a different backend (for example a deployed URL), change `API_BASE_URL` in `js/config.js`.

Start the backend from the repository's backend folder:

```
npm install
npm start
```

The backend needs PostgreSQL with the migration in `backend/migrations` applied, and CORS must allow the origin you serve the frontend from.

## Run the frontend

The frontend is static. Serve the `frontend` folder with any static server.

Option 1, VS Code: install the Live Server extension, right click `frontend/index.html` and choose Open with Live Server (default port 5500).

Option 2, terminal:

```
cd frontend
npx serve -l 5500
```

Then open `http://localhost:5500`.

An internet connection is needed because Tailwind CSS, jQuery and the Inter font are loaded from their CDNs.

## Creating an administrator

Signup always creates a normal user. To make an administrator, sign up first, then run in PostgreSQL:

```
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Sign out and sign in again so the new role is loaded.

## Project structure

```
frontend/
  index.html                  redirects to the dashboard or login
  login.html, signup.html     public pages
  dashboard.html              admin dashboard or user dashboard
  events.html, event-detail.html, event-form.html
  my-registrations.html
  announcements.html, announcement-detail.html, announcement-form.html
  promos.html, promo-detail.html, promo-form.html
  notifications.html, admin-notifications.html
  admin-users.html, profile.html, search.html
  css/styles.css              shared component styles
  js/config.js                API base URL and settings
  js/tailwind-config.js       brand colours and fonts
  js/utils.js                 helpers, formatting, validation, cache
  js/auth.js                  token storage, role checks, guards
  js/api.js                   jQuery AJAX client
  js/ui.js                    toasts, modals, layout, pagination, states
  js/notify.js                notification bell and drawer
  js/charts.js                dependency-free charts
  js/app.js                   page boot
  js/pages/*.js               one script per page
```

## Role based access

Every page declares its access level on the body tag with `data-guard`:

- `guest`: only signed-out visitors (login, signup)
- `auth`: any signed-in user
- `admin`: administrators only; normal users are redirected to the dashboard

The role guard code is commented where it applies:

- `js/auth.js`: `guard()` for pages and `requireAdmin()` for actions
- `js/ui.js`: header admin menu and admin sidebar are only rendered for administrators
- `js/pages/admin-users.js`: page and action guards for user management
- Other admin-only actions call `Auth.requireAdmin()` before sending a request

The UI guards improve the experience only. The backend still enforces authentication and the admin role on every protected route.

## Known backend limitations and how the UI handles them

- No endpoint to mark notifications read: read state is stored per user in localStorage
- The event `published` flag is not applied by the backend, so the toggle has no effect on events
- Feedback listing and averages are admin-only, so normal users see only their own feedback
- A cancelled registration cannot be registered again, and the UI says so
- Announcement audio cannot be replaced on edit, only title and published state
- There is no broadcast notification endpoint: notifications are created automatically when events, announcements and promos are published
- Promo captions are generated in the browser from the caption text

## Video demo

The 5 to 7 minute walkthrough is submitted separately.
