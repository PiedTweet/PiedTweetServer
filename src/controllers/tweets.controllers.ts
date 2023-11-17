import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TWEETS_MESSAGES } from '~/constants/message'
import { TweetRequestBody } from '~/models/requests/Tweet.request'
import { TokenPayload } from '~/models/requests/Users.request'
import tweetsService from '~/services/tweets.services'

export const createTweetController = async (
  req: Request<ParamsDictionary, any, TweetRequestBody>,
  res: Response
) => {
  // muốn đăng bài thì cần user_id, body là nội dung của tweet đó
  const body = req.body as TweetRequestBody
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetsService.createTweet(user_id, body)

  res.json({
    message: TWEETS_MESSAGES.TWEET_CREATED_SUCCESSFULLY,
    result
  })
}
