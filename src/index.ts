import express from 'express'
import userRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/media.routes'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import staticRouter from './routes/static.routes'
import tweetsRouter from './routes/tweet.routes'
import cors from 'cors'
config()

const PORT_BACKEND = process.env.PORT_DEVELOPMENT_BACKEND

const PORT_FRONTEND = process.env.PORT_DEVELOPMENT_FRONTEND

const app = express()
initFolder()

const corsOptions = {
  origin: `http://localhost:${PORT_FRONTEND}`,
  credentials: true,
  allowedHeaders: 'Content-Type,Authorization',
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))

// Middleware to parse incoming requests come with JSON payloads
app.use(express.json())

// MongoDB
databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshTokens()
  databaseService.indexFollowers()
})

// middleware log lại tất cả các request
// app.all('*', (req, res, next) => {
//   console.log('Time', Date.now())
//   console.log(req)
//   next()
// })

app.get('/', (req, res) => {
  res.send('hello world')
})

// express SỬ DỤNG userRouter nếu vô localhost:3000/users
// app.use('/static', express.static(UPLOAD_VIDEO_TEMP_DIR))
app.use('/static', staticRouter)

app.use('/users', userRouter)

app.use('/medias', mediasRouter)

app.use('/tweets', tweetsRouter)

// Error handler tổng
app.use(defaultErrorHandler)

app.listen(PORT_BACKEND, () => {
  console.log(`Project twitter này đang chạy trên port ${PORT_BACKEND}`)
})
