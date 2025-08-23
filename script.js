// TMDB API Integration for MovieVault
class MovieAPI {
    constructor() {
        this.apiKey = API_CONFIG.API_KEY;
        this.baseURL = API_CONFIG.BASE_URL;
        this.imageBaseURL = API_CONFIG.IMAGE_BASE_URL;
        this.cache = new Map(); // Simple caching mechanism
    }

    // Generic fetch method with error handling
    async fetchFromAPI(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}${endpoint}`);
        url.searchParams.append('api_key', this.apiKey);
        
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        const cacheKey = url.toString();
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('API fetch error:', error);
            throw error;
        }
    }

    // Get popular movies
    async getPopularMovies(page = 1) {
        return await this.fetchFromAPI('/movie/popular', { page });
    }

    // Get trending movies
    async getTrendingMovies() {
        return await this.fetchFromAPI('/trending/movie/week');
    }

    // Get top rated movies
    async getTopRatedMovies(page = 1) {
        return await this.fetchFromAPI('/movie/top_rated', { page });
    }

    // Get now playing movies
    async getNowPlayingMovies() {
        return await this.fetchFromAPI('/movie/now_playing');
    }

    // Search movies
    async searchMovies(query, page = 1) {
        return await this.fetchFromAPI('/search/movie', { query, page });
    }

    // Get movie details
    async getMovieDetails(movieId) {
        return await this.fetchFromAPI(`/movie/${movieId}`, { 
            append_to_response: 'credits,videos'
        });
    }

    // Get movies by genre
    async getMoviesByGenre(genreId, page = 1) {
        return await this.fetchFromAPI('/discover/movie', { 
            with_genres: genreId, 
            page,
            sort_by: 'popularity.desc'
        });
    }

    // Transform API data to match your website format
    transformMovieData(movie) {
        return {
            id: movie.id,
            title: movie.title,
            year: movie.release_date?.slice(0, 4) || 'N/A',
            genre: this.getGenreNames(movie.genre_ids || []),
            rating: movie.vote_average?.toFixed(1) || 'N/A',
            runtime: movie.runtime ? `${movie.runtime} min` : 'N/A',
            plot: movie.overview || 'No description available.',
            cast: movie.credits?.cast?.slice(0, 3).map(actor => actor.name).join(', ') || 'Cast information unavailable',
            poster: movie.poster_path ? `${this.imageBaseURL}/${API_CONFIG.POSTER_SIZE}${movie.poster_path}` : null,
            backdrop: movie.backdrop_path ? `${this.imageBaseURL}/${API_CONFIG.BACKDROP_SIZE}${movie.backdrop_path}` : null
        };
    }

    // Helper method to convert genre IDs to names
    getGenreNames(genreIds) {
        const genreMap = {
            28: 'Action', 35: 'Comedy', 18: 'Drama', 27: 'Horror',
            10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller', 16: 'Animation',
            80: 'Crime', 99: 'Documentary', 10751: 'Family', 14: 'Fantasy',
            36: 'History', 10402: 'Music', 9648: 'Mystery', 10770: 'TV Movie',
            37: 'Western', 12: 'Adventure', 10752: 'War'
        };
        return genreIds.slice(0, 2).map(id => genreMap[id] || 'Unknown').join(', ');
    }

    // Get full poster URL
    getPosterURL(posterPath, size = 'w500') {
        return posterPath ? `${this.imageBaseURL}/${size}${posterPath}` : null;
    }

    // Get full backdrop URL
    getBackdropURL(backdropPath, size = 'original') {
        return backdropPath ? `${this.imageBaseURL}/${size}${backdropPath}` : null;
    }
}

// Initialize API instance
const movieAPI = new MovieAPI();

// DOM elements
const searchInput = document.getElementById('searchInput');
const trendingMovies = document.getElementById('trendingMovies');
const topRatedMovies = document.getElementById('topRatedMovies');
const movieModal = document.getElementById('movieModal');
const reviewModal = document.getElementById('reviewModal');
const loadingSpinner = document.getElementById('loadingSpinner');

// Genre mapping for filtering
const genreMapping = {
    'action': 28,
    'comedy': 35,
    'drama': 18,
    'horror': 27,
    'romance': 10749,
    'sci-fi': 878
};

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
    showLoading();
    
    try {
        // Load initial movie data
        await loadInitialMovies();
        
        // Setup event listeners
        setupEventListeners();
        setupModalEvents();
        setupReviewForm();
        
        // Add loading animations
        setTimeout(addLoadingAnimation, 100);
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showError('Failed to load movies. Please try again later.');
    } finally {
        hideLoading();
    }
});

// Load initial movie data from API
async function loadInitialMovies() {
    try {
        // Fetch multiple movie categories concurrently
        const [trendingData, topRatedData, popularData] = await Promise.all([
            movieAPI.getTrendingMovies(),
            movieAPI.getTopRatedMovies(),
            movieAPI.getPopularMovies()
        ]);

        // Transform and display movies
        const trendingMoviesData = trendingData.results.map(movie => movieAPI.transformMovieData(movie));
        const topRatedMoviesData = topRatedData.results.slice(0, 8).map(movie => movieAPI.transformMovieData(movie));

        displayMovies(trendingMoviesData, trendingMovies);
        displayMovies(topRatedMoviesData, topRatedMovies);

        // Load hero background with first trending movie
        if (trendingMoviesData.length > 0) {
            loadHero(trendingMoviesData[0]);
        }

    } catch (error) {
        console.error('Error loading initial movies:', error);
        throw error;
    }
}

// Display movies in grid
function displayMovies(movies, container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (movies.length === 0) {
        container.innerHTML = '<p class="no-results">No movies found.</p>';
        return;
    }
    
    movies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        container.appendChild(movieCard);
    });
}

// Create movie card element
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.onclick = () => openMovieModal(movie);
    
    const posterHTML = movie.poster 
        ? `<img src="${movie.poster}" alt="${movie.title} poster" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\"poster-fallback\\"><i class=\\"fas fa-film\\"></i><span>${movie.title}</span></div>`
        : `<div class="poster-fallback"><i class="fas fa-film"></i><span>${movie.title}</span></div>`;
    
    card.innerHTML = `
        <div class="movie-card-image">
            ${posterHTML}
        </div>
        <div class="movie-card-content">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-meta">
                <span>${movie.year}</span>
                <span>${movie.genre.split(',')[0] || 'Unknown'}</span>
            </div>
            <div class="movie-rating">
                <i class="fas fa-star"></i>
                <span>${movie.rating}</span>
            </div>
        </div>
    `;
    
    return card;
}

// Load hero background
function loadHero(movie) {
    const heroSlide = document.querySelector('.hero-slide');
    if (heroSlide && movie.backdrop) {
        heroSlide.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('${movie.backdrop}')`;
        heroSlide.style.backgroundSize = 'cover';
        heroSlide.style.backgroundPosition = 'center';
    }
}

// Open movie detail modal with API data
// Open movie detail modal with proper poster handling
// Open movie detail modal with proper poster handling

// Open movie detail modal with proper poster handling
async function openMovieModal(movie) {
    try {
        showLoading();
        
        // Fetch detailed movie information if using API
        let detailedMovie = movie;
        if (typeof movieAPI !== 'undefined' && movie.id) {
            try {
                detailedMovie = await movieAPI.getMovieDetails(movie.id);
                detailedMovie = movieAPI.transformMovieData(detailedMovie);
            } catch (apiError) {
                console.warn('Using card data instead of API data:', apiError);
                detailedMovie = movie;
            }
        }
        
        // Update modal text content
        document.getElementById('modalTitle').textContent = detailedMovie.title;
        document.getElementById('modalYear').textContent = detailedMovie.year;
        document.getElementById('modalGenre').textContent = detailedMovie.genre;
        document.getElementById('modalRuntime').textContent = detailedMovie.runtime || 'N/A';
        document.getElementById('modalRating').textContent = detailedMovie.rating;
        document.getElementById('modalPlot').textContent = detailedMovie.plot;
        document.getElementById('modalCast').innerHTML = `<strong>Cast:</strong> ${detailedMovie.cast}`;
        
        // Handle poster image with proper error handling
        const modalPoster = document.getElementById('modalPoster');
        const posterContainer = modalPoster.parentElement;
        
        console.log('Setting modal poster:', detailedMovie.poster); // Debug log
        
        if (detailedMovie.poster) {
            modalPoster.src = detailedMovie.poster;
            modalPoster.alt = `${detailedMovie.title} poster`;
            modalPoster.style.display = 'block';
            
            // Handle successful image load
            modalPoster.onload = function() {
                console.log('✅ Modal poster loaded successfully');
                this.style.opacity = '1';
            };
            
            // Handle image load errors
            modalPoster.onerror = function() {
                console.error('❌ Modal poster failed to load:', detailedMovie.poster);
                posterContainer.innerHTML = `
                    <div class="poster-fallback-large">
                        <i class="fas fa-film"></i>
                        <span>${detailedMovie.title}</span>
                    </div>
                `;
            };
        } else {
            // No poster URL available
            console.warn('No poster URL available for:', detailedMovie.title);
            posterContainer.innerHTML = `
                <div class="poster-fallback-large">
                    <i class="fas fa-film"></i>
                    <span>${detailedMovie.title}</span>
                </div>
            `;
        }
        
        // Load reviews and show modal
        loadSampleReviews();
        movieModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error opening movie modal:', error);
        alert('Failed to load movie details. Please try again.');
    } finally {
        hideLoading();
    }
}


// Loading functions
function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'flex';
    }
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

// Error display function
function showError(message) {
    console.error(message);
    // You can also show a toast or modal here
    alert(message);
}

// Event listeners setup
function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Add genre click handlers
    document.querySelectorAll('.genre-card').forEach(card => {
        card.addEventListener('click', handleGenreClick);
    });
}

function setupModalEvents() {
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Close button handlers
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.target.closest('.modal').style.display = 'none';
        });
    });
}

function setupReviewForm() {
    const reviewForm = document.querySelector('.review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmit);
    }
}

function addLoadingAnimation() {
    // Add any loading animations here
    console.log('Loading animations added');
}

// Hero section loader
function loadHero(movie) {
    const heroSection = document.querySelector('.hero-slide');
    if (heroSection && movie.backdrop) {
        heroSection.style.backgroundImage = `url(${movie.backdrop})`;
    }
}

// Modal opener
function openMovieModal(movie) {
    const modal = document.getElementById('movieModal');
    if (modal) {
        // Populate modal with movie data
        const modalContent = modal.querySelector('.modal-content');
        modalContent.innerHTML = `
            <span class="close-btn">&times;</span>
            <div class="movie-detail">
                <div class="movie-poster-large">
                    ${movie.poster ? 
                        `<img src="${movie.poster}" alt="${movie.title}">` : 
                        `<div class="poster-fallback-large">
                            <i class="fas fa-film"></i>
                            <span>${movie.title}</span>
                        </div>`
                    }
                </div>
                <div class="movie-info">
                    <h1>${movie.title}</h1>
                    <div class="movie-meta">
                        <span>${movie.year}</span>
                        <span>${movie.runtime}</span>
                        <span>${movie.genre}</span>
                    </div>
                    <div class="rating">
                        <span>⭐ ${movie.rating}</span>
                    </div>
                    <p>${movie.plot}</p>
                    <p><strong>Cast:</strong> ${movie.cast}</p>
                    <div class="action-buttons">
                        <button class="btn-primary">Add to Watchlist</button>
                        <button class="btn-secondary">Write Review</button>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        setupModalEvents(); // Re-setup events for new content
    }
}

// Search handler
function handleSearch(event) {
    const query = event.target.value.trim();
    if (query.length > 2) {
        searchMovies(query);
    }
}

// Search movies function
async function searchMovies(query) {
    try {
        showLoading();
        const data = await movieAPI.searchMovies(query);
        const movies = data.results.map(movie => movieAPI.transformMovieData(movie));
        
        // Display search results
        const container = document.getElementById('searchResults') || trendingMovies;
        displayMovies(movies, container);
    } catch (error) {
        showError('Search failed. Please try again.');
    } finally {
        hideLoading();
    }
}

// Genre click handler
function handleGenreClick(event) {
    const genreElement = event.currentTarget;
    const genreName = genreElement.textContent.toLowerCase();
    const genreId = genreMapping[genreName];
    
    if (genreId) {
        loadMoviesByGenre(genreId);
    }
}

// Load movies by genre
async function loadMoviesByGenre(genreId) {
    try {
        showLoading();
        const data = await movieAPI.getMoviesByGenre(genreId);
        const movies = data.results.map(movie => movieAPI.transformMovieData(movie));
        displayMovies(movies, trendingMovies);
    } catch (error) {
        showError('Failed to load genre movies.');
    } finally {
        hideLoading();
    }
}

// Review form handler
function handleReviewSubmit(event) {
    event.preventDefault();
    // Add your review submission logic here
    console.log('Review submitted');
}


// Setup event listeners
function setupEventListeners() {
    let searchTimeout;
    
    // Enhanced search functionality with API
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length > 2) {
            searchTimeout = setTimeout(async () => {
                try {
                    showLoading();
                    const searchResults = await movieAPI.searchMovies(query);
                    const transformedResults = searchResults.results.map(movie => movieAPI.transformMovieData(movie));
                    displayMovies(transformedResults, trendingMovies);
                } catch (error) {
                    console.error('Search error:', error);
                    showError('Search failed. Please try again.');
                } finally {
                    hideLoading();
                }
            }, 500); // Debounce search requests
        } else if (query.length === 0) {
            // Reload trending movies when search is cleared
            loadInitialMovies();
        }
    });
    
    // Genre filtering with API
    document.querySelectorAll('.genre-card').forEach(card => {
        card.addEventListener('click', async function() {
            const genre = this.dataset.genre;
            const genreId = genreMapping[genre];
            
            if (genreId) {
                try {
                    showLoading();
                    const genreMovies = await movieAPI.getMoviesByGenre(genreId);
                    const transformedMovies = genreMovies.results.map(movie => movieAPI.transformMovieData(movie));
                    displayMovies(transformedMovies, trendingMovies);
                    
                    // Scroll to results
                    document.getElementById('trending').scrollIntoView({ behavior: 'smooth' });
                } catch (error) {
                    console.error('Genre filter error:', error);
                    showError('Failed to load movies by genre.');
                } finally {
                    hideLoading();
                }
            }
        });
    });
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
            
            // Smooth scroll to section
            const targetId = this.getAttribute('href');
            if (targetId !== '#signin' && targetId !== '#watchlist') {
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

// Loading and error handling functions
function showLoading() {
    if (loadingSpinner) {
        loadingSpinner.style.display = 'flex';
    }
}

function hideLoading() {
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
}

function showError(message) {
    // You can enhance this with a proper error modal
    console.error(message);
    alert(message);
}

// Load sample reviews (keeping your existing function)
function loadSampleReviews() {
    const reviewsList = document.getElementById('reviewsList');
    const sampleReviews = [
        {
            user: "MovieBuff2023",
            rating: 5,
            comment: "Absolutely stunning visuals and an incredible story. One of the best films I've seen this year!",
            date: "2 days ago"
        },
        {
            user: "CinemaLover",
            rating: 4,
            comment: "Great performances and direction. The soundtrack is also amazing. Highly recommended!",
            date: "1 week ago"
        },
        {
            user: "FilmCritic99",
            rating: 4,
            comment: "A solid entry that delivers on both action and emotion. Worth watching!",
            date: "2 weeks ago"
        }
    ];
    
    reviewsList.innerHTML = sampleReviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <strong class="review-user">${review.user}</strong>
                <div class="review-meta">
                    <div class="review-rating">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}
                    </div>
                    <span class="review-date">${review.date}</span>
                </div>
            </div>
            <p class="review-text">${review.comment}</p>
        </div>
    `).join('');
}

// Open review form
function openReviewForm() {
    reviewModal.style.display = 'block';
}

// Setup modal events (keeping your existing function)
function setupModalEvents() {
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === movieModal || e.target === reviewModal) {
            closeModals();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModals();
        }
    });
}

// Close all modals
function closeModals() {
    movieModal.style.display = 'none';
    reviewModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Setup review form (keeping your existing function)
function setupReviewForm() {
    const stars = document.querySelectorAll('.star');
    const reviewForm = document.getElementById('reviewForm');
    let selectedRating = 0;
    
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            selectedRating = index + 1;
            updateStarDisplay();
        });
        
        star.addEventListener('mouseover', function() {
            highlightStars(index + 1);
        });
    });
    
    document.querySelector('.star-rating').addEventListener('mouseleave', function() {
        updateStarDisplay();
    });
    
    function highlightStars(rating) {
        stars.forEach((star, index) => {
            star.style.color = index < rating ? '#ff6b35' : '#666';
        });
    }
    
    function updateStarDisplay() {
        highlightStars(selectedRating);
    }
    
    reviewForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (selectedRating === 0) {
            alert('Please select a rating!');
            return;
        }
        
        const comment = this.querySelector('textarea').value;
        
        if (comment.trim().length < 10) {
            alert('Please write a more detailed review (at least 10 characters)!');
            return;
        }
        
        alert('Thank you for your review! It has been submitted successfully.');
        
        selectedRating = 0;
        updateStarDisplay();
        this.reset();
        closeModals();
    });
}

// Add loading animations
function addLoadingAnimation() {
    const movieCards = document.querySelectorAll('.movie-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });
    
    movieCards.forEach((card) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s, transform 0.6s';
        observer.observe(card);
    });
}

// Scroll animations for navbar
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.header');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(0, 0, 0, 0.98)';
    } else {
        navbar.style.background = 'rgba(0, 0, 0, 0.95)';
    }
});



// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('movieVaultUsers') || '[]');
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        this.checkLoginStatus();
        this.setupEventListeners();
    }

    checkLoginStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isLoggedIn = true;
            this.updateUIForLoggedInUser();
        }
    }

    setupEventListeners() {
        // Sign in button click
        const signInBtn = document.querySelector('.signin-btn');
        if (signInBtn) {
            signInBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAuthModal();
            });
        }

        // Form submissions
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Form switching
        const showSignUp = document.getElementById('showSignUp');
        const showSignIn = document.getElementById('showSignIn');
        
        if (showSignUp) {
            showSignUp.addEventListener('click', () => this.switchToSignUp());
        }
        
        if (showSignIn) {
            showSignIn.addEventListener('click', () => this.switchToSignIn());
        }

        // Logout
        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Profile dropdown
        const userProfile = document.getElementById('userProfile');
        if (userProfile) {
            userProfile.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = userProfile.querySelector('.dropdown-menu');
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            });
        }
    }

    showAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.style.display = 'block';
            this.switchToSignIn();
        }
    }

    switchToSignUp() {
        const signInForm = document.getElementById('signInForm');
        const signUpForm = document.getElementById('signUpForm');
        
        if (signInForm && signUpForm) {
            signInForm.style.display = 'none';
            signUpForm.style.display = 'block';
        }
    }

    switchToSignIn() {
        const signInForm = document.getElementById('signInForm');
        const signUpForm = document.getElementById('signUpForm');
        
        if (signInForm && signUpForm) {
            signInForm.style.display = 'block';
            signUpForm.style.display = 'none';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Find user in stored users
        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = user;
            this.isLoggedIn = true;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            this.updateUIForLoggedInUser();
            this.closeAuthModal();
            this.showSuccessMessage('Welcome back!');
        } else {
            this.showErrorMessage('Invalid email or password');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        // Check if user already exists
        if (this.users.find(u => u.email === email)) {
            this.showErrorMessage('User with this email already exists');
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now(),
            name: name,
            email: email,
            password: password, // In production, hash this!
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff6b35&color=fff`,
            watchlist: [],
            reviews: [],
            joinDate: new Date().toISOString()
        };

        this.users.push(newUser);
        localStorage.setItem('movieVaultUsers', JSON.stringify(this.users));
        
        this.currentUser = newUser;
        this.isLoggedIn = true;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        this.updateUIForLoggedInUser();
        this.closeAuthModal();
        this.showSuccessMessage('Account created successfully!');
    }

    updateUIForLoggedInUser() {
        const signInBtn = document.querySelector('.signin-btn');
        const userProfile = document.getElementById('userProfile');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');

        if (signInBtn) signInBtn.style.display = 'none';
        if (userProfile) userProfile.style.display = 'flex';
        if (userName) userName.textContent = this.currentUser.name;
        if (userAvatar) userAvatar.src = this.currentUser.avatar;
    }

    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        localStorage.removeItem('currentUser');
        
        const signInBtn = document.querySelector('.signin-btn');
        const userProfile = document.getElementById('userProfile');
        
        if (signInBtn) signInBtn.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
        
        this.showSuccessMessage('Logged out successfully');
    }

    closeAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showSuccessMessage(message) {
        // Create a toast notification
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 1rem 2rem;
            border-radius: 5px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showErrorMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 1rem 2rem;
            border-radius: 5px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // User-specific features
    addToWatchlist(movie) {
        if (!this.isLoggedIn) {
            this.showAuthModal();
            return;
        }

        if (!this.currentUser.watchlist.find(m => m.id === movie.id)) {
            this.currentUser.watchlist.push(movie);
            this.updateUserData();
            this.showSuccessMessage('Added to watchlist!');
        } else {
            this.showErrorMessage('Movie already in watchlist');
        }
    }

    removeFromWatchlist(movieId) {
        if (!this.isLoggedIn) return;

        this.currentUser.watchlist = this.currentUser.watchlist.filter(m => m.id !== movieId);
        this.updateUserData();
        this.showSuccessMessage('Removed from watchlist');
    }

    addReview(movieId, rating, comment) {
        if (!this.isLoggedIn) {
            this.showAuthModal();
            return;
        }

        const review = {
            id: Date.now(),
            movieId: movieId,
            rating: rating,
            comment: comment,
            date: new Date().toISOString()
        };

        this.currentUser.reviews.push(review);
        this.updateUserData();
        this.showSuccessMessage('Review added!');
    }

    updateUserData() {
        // Update in users array
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.users[userIndex] = this.currentUser;
            localStorage.setItem('movieVaultUsers', JSON.stringify(this.users));
        }
        
        // Update current user
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }
}

// Initialize authentication system
const authSystem = new AuthSystem();

// Update your existing openMovieModal function to include watchlist functionality
function openMovieModal(movie) {
    const modal = document.getElementById('movieModal');
    if (modal) {
        const modalContent = modal.querySelector('.modal-content');
        modalContent.innerHTML = `
            <span class="close-btn">&times;</span>
            <div class="movie-detail">
                <div class="movie-poster-large">
                    ${movie.poster ? 
                        `<img src="${movie.poster}" alt="${movie.title}">` : 
                        `<div class="poster-fallback-large">
                            <i class="fas fa-film"></i>
                            <span>${movie.title}</span>
                        </div>`
                    }
                </div>
                <div class="movie-info">
                    <h1>${movie.title}</h1>
                    <div class="movie-meta">
                        <span>${movie.year}</span>
                        <span>${movie.runtime}</span>
                        <span>${movie.genre}</span>
                    </div>
                    <div class="rating">
                        <span>⭐ ${movie.rating}</span>
                    </div>
                    <p>${movie.plot}</p>
                    <p><strong>Cast:</strong> ${movie.cast}</p>
                    <div class="action-buttons">
                        <button class="btn-primary" onclick="authSystem.addToWatchlist(${JSON.stringify(movie).replace(/"/g, '&quot;')})">
                            Add to Watchlist
                        </button>
                        <button class="btn-secondary" onclick="openReviewModal(${movie.id})">
                            Write Review
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        setupModalEvents();
    }
}

// Add review modal function
function openReviewModal(movieId) {
    if (!authSystem.isLoggedIn) {
        authSystem.showAuthModal();
        return;
    }
    
    const reviewModal = document.getElementById('reviewModal');
    if (reviewModal) {
        reviewModal.style.display = 'block';
    }
}
