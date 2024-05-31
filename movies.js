// movies.js

const fs = require("fs-extra");
const path = require("path");
const moviesFilePath = path.join(__dirname, "movies.json");

const loadMovies = async () => {
  try {
    const data = await fs.readFile(moviesFilePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error loading movies:", err);
    return [];
  }
};

const searchMoviesByTitle = async (title) => {
  const movies = await loadMovies();
  return movies.filter((movie) =>
    movie.title.toLowerCase().includes(title.toLowerCase())
  );
};

const searchMoviesByDirector = async (director) => {
  const movies = await loadMovies();
  return movies.filter((movie) =>
    movie.director.toLowerCase().includes(director.toLowerCase())
  );
};

const searchMoviesByActor = async(actor) => {
    const movies = await loadMovies();
    const searchActorLower = actor.toLowerCase();
    return movies.filter(movie => {
        return movie.actor && movie.actor.slice(0, 4).some(actorName => 
            actorName.toLowerCase().includes(searchActorLower)
        );
    });
}
module.exports = {
  searchMoviesByTitle,
  searchMoviesByDirector,
  searchMoviesByActor,
};

