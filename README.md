# WebWinkel 2.0

This is a multi-page website with the client portal at the project root and a separate admin area.

## Structure
- `index.html` — Client Home (the former `client/home.html`). The old public landing page has been replaced.
- `orders.html` — Client packages and orders
- `settings.html` — Client settings
- `login.html` — Client login
- `signup.html` — Client sign up
- `admin/` — Separate admin pages and admin settings
- `assets/` — Logo and other assets
- `js/` — Shared JavaScript
- `config.js` — Supabase configuration

There is no `client/` folder. The client portal pages are at the root. The admin area remains separate in `admin/`.

Each HTML page contains its own CSS inside a `<style>` element. JavaScript is shared in `js/`.
