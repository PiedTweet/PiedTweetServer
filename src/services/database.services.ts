import { MongoClient, Db, Collection } from 'mongodb'
import { config } from 'dotenv'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { Follower } from '~/models/schemas/Follower.schema'
import Tweet from '~/models/schemas/Tweet.schema'

config()
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@tweetprojectk18f3.0j8g7fl.mongodb.net/?retryWrites=true&w=majority`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version

class DatabaseService {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(uri)

    // tạo ra một bản thể của database mình đang muốn kết nối tới
    this.db = this.client.db(`${process.env.DB_NAME}`)
  }

  async connect() {
    try {
      await this.client.db(`${process.env.DB_NAME}`).command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  // ============================= USERS ======================
  // tức là databaseService.users sẽ trả về một collection luôn
  get users(): Collection<User> {
    return this.db.collection(process.env.DB_COLLECTION_USERS as string)
  }

  // optimize database
  async indexUsers() {
    const isExisted = await this.users.indexExists(['email_1', 'username_1', 'email_1_password_1'])
    if (isExisted) return
    await this.users.createIndex({ email: 1 }, { unique: true }) //register
    await this.users.createIndex({ username: 1 }, { unique: true }) //getProfile
    await this.users.createIndex({ email: 1, password: 1 }) //login
  }

  // =========================== REFRESH TOKENS ======================
  // nếu chưa có collection thì tự tạo mới luôn
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_COLLECTION_REFRESH_TOKENS as string)
  }

  async indexRefreshTokens() {
    const isExisted = await this.refreshTokens.indexExists(['token_1', 'exp_1'])
    await this.refreshTokens.createIndex({ token: 1 })
    await this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 300 })
  }

  // =========================== FOLLOWERS ======================
  get followers(): Collection<Follower> {
    return this.db.collection(process.env.DB_COLLECTION_FOLLOWERS as string)
  }

  async indexFollowers() {
    const isExisted = await this.followers.indexExists(['user_id_1_followed_user_id_1'])
    await this.followers.createIndex({ user_id: 1, followed_user_id: 1 })
  }

  // =========================== TWEETS ======================
  get tweets(): Collection<Tweet> {
    return this.db.collection(process.env.DB_COLLECTION_TWEETS as string)
  }
}

const databaseService = new DatabaseService()
export default databaseService
