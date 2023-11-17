import { TweetAudience, TweetType } from '~/constants/enums'
import Media from '../Other'

export interface TweetRequestBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string // k là ObjectId vì ??? string dưới dạng objectId
  hashtags: string[] //người dùng truyền lên dạng string,
  mentions: string[] //mình sẽ convert sang ObjectId sau
  medias: Media[]
}
