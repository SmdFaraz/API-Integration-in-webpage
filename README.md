# MovieVault - Movie Discovery Web Application



MovieVault is a modern, responsive web application for discovering and reviewing movies. It leverages The Movie Database (TMDB) API to provide users with up-to-date information on trending, top-rated, and searchable movies. The application features a sleek, dark-themed interface, detailed movie modals, and a client-side user authentication system for personalized experiences.

## Features

-   **Dynamic Movie Data**: Fetches and displays real-time movie data from the TMDB API.
-   **Multiple Categories**: Browse movies in sections like "Trending," "Top Rated," and "Now Playing."
-   **Live Search**: Instantly search for movies with a debounced search bar that provides results as you type.
-   **Genre Filtering**: Discover movies by browsing through various genres like Action, Comedy, Drama, and Sci-Fi.
-   **Detailed Movie View**: Click on any movie to open a modal with comprehensive details, including:
    -   High-resolution poster and backdrop.
    -   Title, release year, runtime, and genres.
    -   TMDB rating, plot summary, and top cast members.
-   **User Authentication**: A complete client-side authentication system using `localStorage`:
    -   User sign-up and sign-in forms.
    -   Personalized user profile with an avatar and dropdown menu.
    -   Session persistence across browser reloads.
-   **Personalized Watchlist**: Logged-in users can add and remove movies from their personal watchlist.
-   **Review System**: An interactive UI for users to write and submit reviews with a star rating.
-   **Responsive Design**: The layout is fully responsive and optimized for desktop, tablet, and mobile devices.
-   **Loading & Error States**: Includes loading spinners for asynchronous operations and user-friendly error notifications.
-   **Client-Side Caching**: A simple caching mechanism is implemented to reduce redundant API calls and improve performance.

## Tech Stack

-   **Frontend**: HTML5, CSS3, JavaScript (ES6+)
-   **API**: [The Movie Database (TMDB) API](https://www.themoviedb.org/documentation/api)
-   **Libraries**:
    -   [Font Awesome](https://fontawesome.com/) for icons.
    -   [Google Fonts](https://fonts.google.com/) for typography ('Inter').

## Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/smdfaraz/api-integration-in-webpage.git
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd api-integration-in-webpage
    ```

3.  **API Key Configuration:**
    The project uses an API key from TMDB. The key is included in `config.js`. If you encounter API issues (e.g., rate-limiting), you can replace it with your own free key from [the TMDB website](https://www.themoviedb.org/signup).

    ```javascript
    // config.js
    const API_CONFIG = {
        API_KEY: 'YOUR_TMDB_API_KEY',
        // ... other settings
    };
    ```

4.  **Run on a Local Server:**
    Due to browser security policies (CORS), you cannot run the project by simply opening `index.html` from the file system. You need to serve it using a local web server.

    If you have Python installed, you can use its built-in server:
    ```bash
    # For Python 3.x
    python -m http.server

    # For Python 2.x
    python -m SimpleHTTPServer
    ```
    
    Alternatively, you can use other tools like `live-server` for VS Code or `npx serve`.

5.  **Open in browser:**
    Open your web browser and navigate to `http://localhost:8000` (or the port specified by your local server).

## Project Structure

The repository contains the following key files:

-   `index.html`: The main HTML file that defines the structure and layout of the web application, including all sections, modals, and the main grid.
-   `styles.css`: Contains all the CSS rules for styling the application. It includes styles for the navbar, hero section, movie cards, modals, authentication forms, and responsive design media queries.
-   `script.js`: The core JavaScript logic. It is divided into several parts:
    -   **`MovieAPI` Class**: A wrapper for the TMDB API, handling all fetch requests, error management, and data transformation.
    -   **`AuthSystem` Class**: Manages user registration, login, logout, and session state using `localStorage`. It also handles user-specific data like watchlists.
    -   **UI Manipulation**: Functions to display movies, update modals, and manage loading states.
    -   **Event Listeners**: Sets up all user interactions, including search, genre clicks, modal triggers, and form submissions.
-   `config.js`: A configuration file to store the TMDB API key and other related URLs, keeping them separate from the main application logic.
