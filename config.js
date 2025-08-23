// config.js
const API_CONFIG = {
    API_KEY: 'cc37f838c448d4c89ca4f958ae068d7d', 
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
    POSTER_SIZE: 'w500',
    BACKDROP_SIZE: 'original'
};


if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}   