

var API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwM2EzYzM0Zjg4MDNlMmNmOTkwNDRkMGNiYTJhZDRkMiIsIm5iZiI6MTc3MzI0MDMwMS40MDEsInN1YiI6IjY5YjE3ZmVkZDVkNmZkMjNhYTA5NDRlYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ec-LTPbqPDm-oq4QSmB1oVTIMG4YKON7svOcwgwhIXA';

// Base URL for movie poster images
var IMG_BASE = 'https://image.tmdb.org/t/p/';


// ── LOGIN CHECK ──
// If user is not logged in, send them to login page
// We skip this check if they are already ON the login page
var currentPage = window.location.pathname;
var loggedInUser = localStorage.getItem('userSession');

if (loggedInUser == null && currentPage.includes('login.html') == false) {
    window.location.href = 'login.html';
}


// ── FETCH MOVIES FROM TMDB ──
// This function calls the TMDB API and returns the result
async function tmdbFetch(endpoint) {
    var url = 'https://api.themoviedb.org/3/' + endpoint;

    var response = await fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + API_TOKEN,
            'Content-Type': 'application/json'
        }
    });

    var data = await response.json();
    return data;
}


// ── GO TO MOVIE DETAILS PAGE ──
// Save the movie ID first, then go to details page
function goToDetails(movieId) {
    localStorage.setItem('selectedMovieId', movieId);
    window.location.href = 'details.html';
}


// ── GO TO STUDIO / FRANCHISE PAGE ──
// Save studio info and go to results page
function goToStudio(studioId, studioName) {
    localStorage.setItem('activeStudio', studioId);
    localStorage.setItem('activeStudioName', studioName);
    window.location.href = 'results.html';
}


// ── FAVORITES FUNCTIONS ──

// Get the favorites list from localStorage
function getFavorites() {
    var stored = localStorage.getItem('myFavorites');
    if (stored == null) {
        return []; // return empty array if nothing saved
    }
    return JSON.parse(stored);
}

// Save the favorites list to localStorage
function saveFavorites(list) {
    localStorage.setItem('myFavorites', JSON.stringify(list));
}

// Check if a movie is already in favorites
function isMovieFavorite(movieId) {
    var favorites = getFavorites();
    for (var i = 0; i < favorites.length; i++) {
        if (favorites[i].id == movieId) {
            return true;
        }
    }
    return false;
}

// Add or remove a movie from favorites (called when heart icon is clicked)
function toggleFavorite(movieId, movieTitle, posterPath, event) {
    // Stop the click from also opening the movie page
    event.stopPropagation();

    var favorites = getFavorites();
    var alreadySaved = isMovieFavorite(movieId);

    if (alreadySaved == false) {
        // Movie not in favorites, so ADD it
        var newMovie = {
            id: movieId,
            title: movieTitle,
            poster: posterPath
        };
        favorites.push(newMovie);
        event.target.classList.add('active'); // turn heart red
        showToast('❤️ Added to favorites!');
    } else {
        // Movie already in favorites, so REMOVE it
        var updatedList = [];
        for (var i = 0; i < favorites.length; i++) {
            if (favorites[i].id != movieId) {
                updatedList.push(favorites[i]);
            }
        }
        favorites = updatedList;
        event.target.classList.remove('active'); // turn heart grey
        showToast('💔 Removed from favorites');
    }

    saveFavorites(favorites);
}


// ── WATCHED FUNCTIONS ──

// Get the watched list from localStorage
function getWatched() {
    var stored = localStorage.getItem('myWatched');
    if (stored == null) {
        return [];
    }
    return JSON.parse(stored);
}

// Save the watched list to localStorage
function saveWatched(list) {
    localStorage.setItem('myWatched', JSON.stringify(list));
}

// Check if a movie is already marked as watched
function isMovieWatched(movieId) {
    var watched = getWatched();
    for (var i = 0; i < watched.length; i++) {
        if (watched[i].id == movieId) {
            return true;
        }
    }
    return false;
}

// Add or remove a movie from watched list (called when eye icon is clicked)
function toggleWatched(movieId, movieTitle, posterPath, event) {
    event.stopPropagation();

    var watched = getWatched();
    var alreadyWatched = isMovieWatched(movieId);

    if (alreadyWatched == false) {
        var newMovie = {
            id: movieId,
            title: movieTitle,
            poster: posterPath
        };
        watched.push(newMovie);
        event.target.classList.add('active');
        showToast('👁️ Marked as watched!');
    } else {
        var updatedList = [];
        for (var i = 0; i < watched.length; i++) {
            if (watched[i].id != movieId) {
                updatedList.push(watched[i]);
            }
        }
        watched = updatedList;
        event.target.classList.remove('active');
        showToast('🙈 Removed from watched');
    }

    saveWatched(watched);
}


// ── BUILD A MOVIE CARD ──
// Takes a movie object and returns the HTML for one card
function buildCard(movie) {
    // Check if this movie is already favorited or watched
    var isFav     = isMovieFavorite(movie.id);
    var isWatched = isMovieWatched(movie.id);

    // Build poster image URL
    var posterUrl = '';
    if (movie.poster_path != null) {
        posterUrl = IMG_BASE + 'w300' + movie.poster_path;
    } else {
        posterUrl = 'https://via.placeholder.com/180x270/10101e/888?text=No+Poster';
    }

    // Get movie title (some TMDB results use "name" instead of "title")
    var movieTitle = movie.title;
    if (movieTitle == null) {
        movieTitle = movie.name;
    }

    // Get rating and round it to 1 decimal
    var rating = 0;
    if (movie.vote_average != null) {
        rating = movie.vote_average.toFixed(1);
    }

    // Set heart class — red if favorited, grey if not
    var heartClass = 'heart';
    if (isFav) {
        heartClass = 'heart active';
    }

    // Set eye class — yellow if watched, grey if not
    var eyeClass = 'eye-btn';
    if (isWatched) {
        eyeClass = 'eye-btn active';
    }

    // Build and return the HTML card string
    var html = '';
    html += '<div class="card" onclick="goToDetails(' + movie.id + ')">';
    html += '<span class="' + eyeClass + '" onclick="toggleWatched(' + movie.id + ',\'' + movieTitle + '\',\'' + movie.poster_path + '\',event)">👁</span>';
    html += '<span class="' + heartClass + '" onclick="toggleFavorite(' + movie.id + ',\'' + movieTitle + '\',\'' + movie.poster_path + '\',event)">❤</span>';
    html += '<img src="' + posterUrl + '" loading="lazy" onerror="this.src=\'https://via.placeholder.com/180x270/10101e/888?text=No+Poster\'">';
    html += '<div class="card-info">';
    html += '<h4>' + movieTitle + '</h4>';
    html += '<p>⭐ ' + rating + '</p>';
    html += '</div>';
    html += '</div>';

    return html;
}


// ── SHOW TOAST NOTIFICATION ──
// Shows a small popup message at the bottom of the screen
function showToast(message) {
    // Remove any old toast that might still be showing
    var oldToast = document.querySelector('.toast');
    if (oldToast != null) {
        oldToast.remove();
    }

    // Create a new toast div element
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    // Add it to the page so it becomes visible
    document.body.appendChild(toast);

    // After 2.8 seconds, start fading it out
    setTimeout(function() {
        toast.classList.add('hide');

        // After the fade animation finishes (0.3s), remove it from page
        setTimeout(function() {
            toast.remove();
        }, 300);

    }, 2800);
}


// ── SEARCH BAR ──
var searchTimer = null;

function initSearch() {
    var searchInput   = document.getElementById('searchInput');
    var searchDropdown = document.getElementById('searchDropdown');

    // If there's no search bar on this page, stop here
    if (searchInput == null) {
        return;
    }

    // Every time user types, wait 400ms then search
    searchInput.addEventListener('input', function() {
        // Cancel the previous timer so we don't search on every keypress
        clearTimeout(searchTimer);

        var query = searchInput.value.trim();

        if (query == '') {
            searchDropdown.classList.remove('open');
            return;
        }

        // Only search after user has stopped typing for 400ms
        searchTimer = setTimeout(function() {
            searchMovies(query);
        }, 400);
    });

    // Close dropdown when user clicks somewhere else on the page
    document.addEventListener('click', function(event) {
        var clickedInsideSearch = event.target.closest('.nav-search');
        if (clickedInsideSearch == null) {
            searchDropdown.classList.remove('open');
        }
    });
}

// Search TMDB and show results in the dropdown
async function searchMovies(query) {
    var dropdown = document.getElementById('searchDropdown');

    // Show a loading message while we wait
    dropdown.innerHTML = '<div style="padding:16px; color:var(--muted); font-size:0.85rem;">🔍 Searching...</div>';
    dropdown.classList.add('open');

    try {
        var data = await tmdbFetch('search/movie?query=' + encodeURIComponent(query) + '&include_adult=false');
        var movies = data.results;

        if (movies == null || movies.length == 0) {
            dropdown.innerHTML = '<div style="padding:16px; color:var(--muted); font-size:0.85rem;">No movies found.</div>';
            return;
        }

        // Build HTML for up to 8 results
        var html = '';
        for (var i = 0; i < movies.length && i < 8; i++) {
            var movie = movies[i];

            // Build poster URL
            var posterSrc = 'https://via.placeholder.com/36x54/10101e/888?text=?';
            if (movie.poster_path != null) {
                posterSrc = IMG_BASE + 'w92' + movie.poster_path;
            }

            // Get release year
            var year = 'N/A';
            if (movie.release_date != null && movie.release_date != '') {
                year = movie.release_date.slice(0, 4);
            }

            var rating = (movie.vote_average || 0).toFixed(1);

            html += '<div class="search-result-item" onclick="goToDetails(' + movie.id + ')">';
            html += '<img src="' + posterSrc + '" onerror="this.src=\'https://via.placeholder.com/36x54\'">';
            html += '<div class="search-result-info">';
            html += '<h4>' + movie.title + '</h4>';
            html += '<p>' + year + ' · ⭐ ' + rating + '</p>';
            html += '</div>';
            html += '</div>';
        }

        dropdown.innerHTML = html;

    } catch (error) {
        dropdown.innerHTML = '<div style="padding:16px; color:var(--muted);">Search failed. Try again.</div>';
    }
}


// ── LOGOUT ──
function logout() {
    localStorage.removeItem('userSession');
    window.location.href = 'login.html';
}
