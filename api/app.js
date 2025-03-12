const cors = require('cors')
const express = require('express')
const movies = require('../movies.json')
const crypto = require('node:crypto')
const { validateMovie, validatePartialMovie } = require('./movies')

const app = express()
app.use(express.json())
app.use(cors({ // Por defecto pone un *
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://192.168.0.106:8080'
    ]

    if (ACCEPTED_ORIGINS.includes(origin)) return callback(null, true)
    if (!origin) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  }
}))

app.disable('x-powered-by')

// los métodos PUT/PATCH/DELETE utilizan CORS-preflight
// y solicitan un verbo OPTIONS

// Todos lo recursos que sea Movies se identifica con /movies
app.get('/movies', (req, res) => { // Filtrado por género
  // const origin = req.headers.origin
  // // Si la petición se hace desde el mismo dominio no se manda la cabecera ORIGIN
  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
  //   res.header('Access-Control-Allow-Origin', origin)
  // }
  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filteredMovies)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (!movie) res.status(404).json({ message: 'Movie not found' })
  res.json(movie)
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    // 422. Unprocessable Entity -> El servidor ha entendido el contenido de la petición, pero no lo puede procesar
    // return res.status(422).json({ error: result.error.message })
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  // en bd
  const newMovie = {
    id: crypto.randomUUID(), // Genera un id aleatorio v4 único universalmente
    ...result.data // X req.body
  }

  // Esto no es REST, porque se esta guardando en el
  // estado de la apliación en memoria
  movies.push(newMovie)

  // Estado 201 creado
  res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
  // const origin = req.header('origin')
  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
  //   res.header('Access-Control-Allow-Origin', origin)
  //   res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
  // }
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

// Actualizar una pelicula
app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) return res.status(404).json({ message: 'Movie not found' })

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  // El id no se puede actualizar, ya que no se esta validando
  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

app.options('/movies/:id', (req, res) => {
  // const origin = req.header('origin')
  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
  //   res.header('Access-Control-Allow-Origin', origin)
  //   res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
  // }
  res.sendStatus(200)
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`)
})
