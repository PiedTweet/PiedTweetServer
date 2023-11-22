import axios from 'axios'
import { Follower } from './../models/schemas/Follower.schema'
import databaseService from '~/services/database.services'
import User from '~/models/schemas/User.schema'
import { IRegisterReqBody, IUpdateMeReqBody } from '~/models/requests/Users.request'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { config } from 'dotenv'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/message'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
config()

class UsersService {
  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      publicOrSecretKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  // hàm nhận vào user_id để bỏ vào payload tạo access token
  signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN
      }
    })
  }

  // hàm nhận vào user_id để bỏ vào payload tạo refresh token
  signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    // nếu exp tồn tại thì không set expiresIn
    if (exp) {
      return signToken({
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify,
          exp
        }
      })
    } else {
      return signToken({
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify
        },
        options: {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN
        }
      })
    }
  }

  // hàm signEmailVerifyToken
  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      payload: {
        user_id,
        token_type: TokenType.EmailVerificationToken,
        verify
      },
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN
      }
    })
  }

  // ký access_token và refresh_token
  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify })
    ])
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async register(payLoad: IRegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified //0
    })

    const result = await databaseService.users.insertOne(
      new User({
        ...payLoad,
        _id: user_id,
        username: `user${user_id.toString()}`,
        email_verify_token,
        date_of_birth: new Date(payLoad.date_of_birth),
        password: hashPassword(payLoad.password)
      })
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })

    const { exp, iat } = await this.decodeRefreshToken(refresh_token)

    // lưu refresh_token vào database
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ token: refresh_token, user_id: new ObjectId(user_id), exp, iat })
    )

    // aws ses
    // giả lập gửi mail verify
    console.log('giả lập gửi mail verify từ register')
    console.log(email_verify_token)

    return { access_token: access_token, refresh_token: refresh_token }
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    // dùng user_id tạo ra access_token và refresh_token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify
    })

    // lưu refresh_token vào database
    // một ng dùng có thể có nhiều refresh do có nhiều thiết bị
    const { exp, iat } = await this.decodeRefreshToken(refresh_token)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ token: refresh_token, user_id: new ObjectId(user_id), exp, iat })
    )

    return { access_token: access_token, refresh_token: refresh_token }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return { message: USERS_MESSAGES.LOGOUT_SUCCESS }
  }

  async verifyEmail(user_id: string) {
    // update lại user
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          email_verify_token: '',
          updated_at: '$$NOW'
        }
      }
    ])

    // tạo ra access_token và refresh_token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id,
      verify: UserVerifyStatus.Verified
    })

    // lưu refresh_token vào database
    const { exp, iat } = await this.decodeRefreshToken(refresh_token)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ token: refresh_token, user_id: new ObjectId(user_id), exp, iat })
    )
    return { access_token: access_token, refresh_token: refresh_token }
  }

  async resendEmailVerify(user_id: string) {
    // tạo ra email_verify_token
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id,
      verify: UserVerifyStatus.Unverified
    })

    // update lại user
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          email_verify_token,
          updated_at: '$$NOW'
        }
      }
    ])

    // aws ses
    // giả lập gửi mail verify
    console.log('giả lập gửi mail verify từ resendEmailVerify')
    console.log(email_verify_token)

    return { message: USERS_MESSAGES.RESEND_EMAIL_VERIFY_SUCCESS }
  }

  // hàm signEmailVerifyToken
  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN
      }
    })
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    // tạo ra forgot_password_token
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })

    // update lại user
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          forgot_password_token,
          updated_at: '$$NOW'
        }
      }
    ])

    // aws ses
    // giả lập gửi mail verify
    console.log(forgot_password_token)

    return { message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD }
  }

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    // dựa vào user id tìm và cập nhật
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
          updated_at: '$$NOW'
        }
      }
    ])
    return { message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS }
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      { projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 } }
    )
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return user
  }

  async updateMe(user_id: string, payload: IUpdateMeReqBody) {
    // nếu người dùng muốn update date_of_birth thì phải chuyển về dạng date
    //                                            nếu có date_of_birth thì ghi đè date_of_birth cũ
    const _payload = payload.date_of_birth
      ? { ...payload, date_of_birth: new Date(payload.date_of_birth) }
      : payload

    // tiến thành cập nhật thông tin mới cho user
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      [
        {
          $set: {
            ..._payload,
            updated_at: '$$NOW'
          }
        }
      ],
      {
        returnDocument: 'after', //sau khi cập nhật xong thì trả về document đó
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          //tức là khi trả về thì KHÔNG trả về những cái này
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )

    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return user
  }

  async follow(user_id: string, followed_user_id: string) {
    // kiểm tra xem đã follow chưa
    const isFollowed = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    // nếu đã follow rồi thì return message
    if (isFollowed !== null) {
      return { message: USERS_MESSAGES.USER_ALREADY_FOLLOWED }
    }
    // chưa thì thêm 1 document vào collection followers
    await databaseService.followers.insertOne(
      new Follower({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      })
    )
    return { message: USERS_MESSAGES.FOLLOW_SUCCESS }
  }

  async unfollow(user_id: string, followed_user_id: string) {
    // kiểm tra mình đã follow chưa
    const isFollowed = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (!isFollowed) {
      return USERS_MESSAGES.USER_ALREADY_UNFOLLOWED
    }

    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    return { message: USERS_MESSAGES.UNFOLLOW_SUCCESS }
  }

  async changePassword(user_id: string, password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            password: hashPassword(password),
            updated_at: '$$NOW'
          }
        }
      ]
    )
    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
    }
  }

  async refreshToken({
    user_id,
    refresh_token,
    verify,
    exp
  }: {
    user_id: string
    refresh_token: string
    verify: UserVerifyStatus
    exp: number
  }) {
    // xóa refresh_token cũ
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })

    // tạo ra access_token và refresh_token mới
    const [access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp })
    ])

    // nhét refresh_token mới vào database
    const { iat } = await this.decodeRefreshToken(refresh_token)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ token: new_refresh_token, user_id: new ObjectId(user_id), exp, iat })
    )

    return { access_token: access_token, refresh_token: new_refresh_token }
  }

  // getOAuthGoogleToken dùng code nhận đc để yêu cầu google tạo id_token
  private async getOAuthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }

    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return data as {
      access_token: string
      id_token: string
    }
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })

    return data as {
      id: string
      email: string
      email_verified: boolean
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }

  async oAuth(code: string) {
    const { access_token, id_token } = await this.getOAuthGoogleToken(code)

    const userInfo = await this.getGoogleUserInfo(access_token, id_token)

    // kiểm tra user đã verify chưa
    if (!userInfo.email_verified) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.EMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // kiểm tra xem email đó có trong database chưa
    const user = await databaseService.users.findOne({ email: userInfo.email })
    // nếu có tức là client muốn đăng nhập
    if (user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify
      })
      // lưu lại refresh_token vào database
      const { exp, iat } = await this.decodeRefreshToken(refresh_token)

      await databaseService.refreshTokens.insertOne(
        new RefreshToken({ token: refresh_token, user_id: new ObjectId(user._id), exp, iat })
      )
      return {
        access_token: access_token,
        refresh_token: refresh_token,
        new_user: 0,
        verify: user.verify
      }
      // nếu chưa nghĩa là client muốn đăng ký
    } else {
      // bởi vì đang đăng nhập bằng google nên mình random luôn password, mình ko biết client không biết
      const password = Math.random().toString(36).slice(1, 15)

      const data = await this.register({
        name: userInfo.name,
        email: userInfo.email,
        password: password,
        confirm_password: password,
        date_of_birth: new Date().toISOString()
      })

      return {
        ...data,
        new_user: 1,
        verify: UserVerifyStatus.Unverified
      }
    }
  }
  // for testing
  // const result = await this.getOAuthGoogleToken(code)
  // console.log(result)
  // return result
}
const usersService = new UsersService()
export default usersService
