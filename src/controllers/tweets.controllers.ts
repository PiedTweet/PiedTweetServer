import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TWEETS_MESSAGES } from '~/constants/message'
import { ITweetRequestBody } from '~/models/requests/Tweet.request'
import { ITokenPayload } from '~/models/requests/Users.request'
import tweetsService from '~/services/tweets.services'

export const createTweetController = async (
  req: Request<ParamsDictionary, any, ITweetRequestBody>,
  res: Response
) => {
  // muốn đăng bài thì cần user_id, body là nội dung của tweet đó
  const body = req.body as ITweetRequestBody
  const { user_id } = req.decoded_authorization as ITokenPayload
  const result = await tweetsService.createTweet(user_id, body)

  res.json({
    message: TWEETS_MESSAGES.TWEET_CREATED_SUCCESSFULLY,
    result
  })
}
