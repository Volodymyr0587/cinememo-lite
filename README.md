# 🎬 CineMemo Lite

A simple, lightweight personal movie and series library built with **HTML, CSS, and vanilla JavaScript**.

CineMemo Lite is a small static analogue of a personal media tracker. There is no backend, database, framework, build system, or external API — the entire library is stored in a single `data.json` file.

The project is designed to be simple to understand, easy to modify, and easy to run locally.

---

## ✨ Features

- 🎬 Movie and series library
- 🔎 Search by title, description, type, status, and genres
- 🎞️ Filter by:
    - Movie / Series
    - Watching / Watched / Will Watch / Waiting

- ↕️ Sorting:
    - Title A–Z
    - Title Z–A
    - Newest first
    - Oldest first
    - Highest rating
    - Lowest rating

- ⭐ Optional ratings
- 🏷️ Genres
- 🖼️ Poster images
- 🖼️ Automatic placeholder when a poster is missing
- 📄 Separate details page for every title
- 🔗 Stable URL using the item's ID
- 📱 Responsive layout for desktop, tablet, and mobile
- 🌙 Dark cinematic interface
- ⚡ No dependencies or build tools

---

## 🛠️ Technologies

CineMemo Lite intentionally uses only browser-native technologies:

- **HTML5**
- **CSS3**
- **JavaScript (ES6+)**
- **JSON**

No:

- PHP
- Laravel
- Node.js
- npm
- database
- JavaScript framework
- CSS framework
- external API

---

## 📁 Project Structure

```text
cinememo-lite/
├── index.html
├── show.html
├── script.js
├── main.css
├── data.json
└── assets/
    └── images/
        ├── placeholder.jpg
        ├── stranger-things.jpg
        ├── interstellar.jpg
        ├── the-last-of-us.jpg
        ├── dune-part-two.jpg
        ├── breaking-bad.jpg
        ├── lord-of-the-rings-fellowship.jpg
        ├── dark.jpg
        └── blade-runner-2049.jpg
```

### `index.html`

The main library page.

It contains:

- CineMemo Lite header
- Search
- Filters
- Sorting
- Number of titles
- Media list
- Empty state

### `show.html`

The details page for a single movie or series.

A title is selected using the `id` query parameter:

```text
show.html?id=1
```

### `script.js`

Contains all application logic:

- Loading `data.json`
- Searching
- Filtering
- Sorting
- Rendering the library
- Rendering the details page
- Handling missing images
- Handling invalid IDs

### `main.css`

Contains all styling for both pages, including responsive layouts.

### `data.json`

The library itself.

This is the main file you edit when adding, removing, or changing movies and series.

### `assets/images/`

Contains poster images.

`placeholder.jpg` is used automatically when an item does not have a poster.

---

## 📦 Data Format

Each title in `data.json` has the following structure:

```json
{
    "id": 1,
    "title": "Interstellar",
    "type": "Movie",
    "year": 2014,
    "status": "Watched",
    "image": "assets/images/interstellar.jpg",
    "genres": ["Drama", "Sci-Fi"],
    "rating": 10,
    "description": "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival."
}
```

### Available fields

| Field         | Type        | Description               |
| ------------- | ----------- | ------------------------- |
| `id`          | integer     | Unique identifier         |
| `title`       | string      | Movie or series title     |
| `type`        | string      | `Movie` or `Series`       |
| `year`        | integer     | Release year              |
| `status`      | string      | Current watching status   |
| `image`       | string/null | Poster path               |
| `genres`      | array       | List of genres            |
| `rating`      | number/null | Personal rating from 1–10 |
| `description` | string      | Short description         |

---

## ➕ Adding a New Title

Open:

```text
data.json
```

Add another object to the array:

```json
{
    "id": 10,
    "title": "The Matrix",
    "type": "Movie",
    "year": 1999,
    "status": "Will Watch",
    "image": "assets/images/the-matrix.jpg",
    "genres": ["Action", "Sci-Fi"],
    "rating": null,
    "description": "A computer hacker discovers that reality is not what it seems."
}
```

Then place the poster at:

```text
assets/images/the-matrix.jpg
```

The title will automatically appear in the library.

No JavaScript changes are required.

---

## 🖼️ Missing Posters

A poster is optional.

You can simply use:

```json
"image": null
```

For example:

```json
{
    "id": 11,
    "title": "Some Movie",
    "type": "Movie",
    "year": 2025,
    "status": "Will Watch",
    "image": null,
    "genres": ["Drama"],
    "rating": null,
    "description": "A movie without a poster."
}
```

CineMemo Lite automatically displays:

```text
assets/images/placeholder.jpg
```

The same fallback is also used if a specified image file cannot be loaded.

---

## ▶️ Running the Project

Because the project loads `data.json` using `fetch()`, opening `index.html` directly with `file://` may not work in some browsers.

The easiest solution is to use a small local HTTP server.

### Python

If Python is installed:

```bash
cd cinememo-lite

python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

---

### PHP

If PHP is installed:

```bash
cd cinememo-lite

php -S localhost:8000
```

Then open:

```text
http://localhost:8000
```

No PHP code is used by the application itself. PHP is only being used here as a simple local web server.

---

## 🔗 Details URLs

Every title has a stable numeric ID.

For example:

```text
show.html?id=1
```

```text
show.html?id=5
```

```text
show.html?id=9
```

The ID is defined in `data.json`:

```json
"id": 1
```

IDs should remain unique.

If an existing title is removed, its ID does not need to be reused.

---

## 🎨 Design

CineMemo Lite uses a dark cinematic visual style with:

- dark background
- purple accents
- gold highlights
- subtle borders
- compact media rows
- poster thumbnails
- responsive layouts
- minimal visual effects

The goal is to keep the interface visually close to a modern personal media library without introducing a UI framework.

---

## 📱 Responsive Design

The layout adapts to different screen sizes.

### Desktop

The library uses a compact list with:

```text
# | Poster | Title / metadata / genres / description
```

### Mobile

The layout becomes more compact and the show page places the poster above the title and information.

---

## 🚫 No Backend

CineMemo Lite intentionally does not have:

- user accounts
- authentication
- database
- CRUD API
- server-side rendering
- external movie APIs
- automatic metadata importing

All data is stored locally in:

```text
data.json
```

This makes the project useful as a small personal library and as a simple frontend prototype.

---

## 🔮 Possible Future Improvements

The project can later be extended with:

- Genres filter
- Multiple statuses
- Personal notes
- Favorite titles
- Watch dates
- Seasons and episodes
- Runtime
- Directors
- Actors
- Trailers
- Pagination
- LocalStorage
- Import/export JSON
- Editable library interface
- Statistics and charts
- PWA support
- External movie API integration
- Backend/database version

A future backend implementation could turn CineMemo Lite into a full CineMemo application with authentication, database storage, user collections, reviews, comments, and other features.

---

## 📄 License

This project currently has no specific open-source license.

You are free to study, modify, and experiment with the code. If you plan to redistribute the project or use it commercially, consider adding an appropriate license to the repository.

---

## 🎬 About

**CineMemo Lite** is a deliberately simple version of a personal movie and series tracker.

It is intended primarily as a small, understandable project that demonstrates how far you can get with plain:

```text
HTML + CSS + JavaScript + JSON
```

No framework required.
