# CivicEvents+

A civic events platform where residents can browse events, register, listen to audio announcements, watch captioned promo videos and receive notifications, and administrators manage everything from a dashboard.

## Links

- Repository: https://github.com/nezyman/advanced-frontend-dev-summative-civic-event-project
- Demo video: https://youtu.be/pJCOhl7BRKU
- The demo video link is also saved in the [`video-demo`](video-demo/README.md) folder

## Repository structure

```
backend/      Node.js, Express and PostgreSQL API
frontend/     HTML, Tailwind CSS and jQuery web app
video-demo/   Link to the demo video
```

## Frontend

The frontend is built with HTML, Tailwind CSS (CDN) and jQuery only, and all of its code is in the `frontend` folder. Full details are in [frontend/README.md](frontend/README.md).

Main features:

- Signup with a password strength meter, login, token handling and session expiry
- Administrator and user roles, with guards on pages, navigation and actions
- Events with filters, pagination, registration, feedback, and admin create and edit with image upload
- Audio announcements with an accessible player
- Promo videos with captions and transcript
- Notification bell, drawer and inbox
- Admin dashboard with charts and user management
- Loading skeletons, error handling with retry, accessibility and lazy loading

## How to run

1. Create a PostgreSQL database named `civic-events-db` and run `backend/migrations/001_create_tables.sql` on it.
2. Create `backend/.env` with `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`, `DB_NAME` and `JWT_SECRET`.
3. Start the backend:
   ```
   cd backend
   npm install
   npm start
   ```
   The API runs at `http://localhost:4000/api`.
4. Start the frontend:
   ```
   cd frontend
   npx serve -l 5500
   ```
   Or open `frontend/index.html` with the VS Code Live Server extension.
5. Open `http://localhost:5500/index.html`.

The backend URL is set in `frontend/js/config.js`.

## Admin account

Signup creates a normal user. To make an administrator, run this in PostgreSQL after signing up, then sign in again:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```