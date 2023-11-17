import { Router } from 'express'
import { createTweetController } from '~/controllers/tweets.controllers'
import { createTweetValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'

const tweetsRouter = Router()

/*
des: create tweet
method: post
headers: {Authorization: Bearer <access_token>}
body: TweetRequestBody

khi muốn đăng một bài tweet thì client sẽ gữi lên server một request có body  như 
TweetRequestBody(ta chưa làm) kém theo access_token để biết ai là người đăng bài
*/

tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapAsync(createTweetController)
)

//createTweetValidator và createTweetController ta chưa làm

export default tweetsRouter
