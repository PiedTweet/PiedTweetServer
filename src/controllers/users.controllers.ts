import { ParamsDictionary } from 'express-serve-static-core'
import { NextFunction, Request, Response } from 'express'
import usersService from '~/services/users.services'
import {
  IChangePasswordReqBody,
  FollowReqBody,
  IGetProfileReqParams,
  ILoginReqBody,
  ILogoutReqBody,
  IRefreshTokenReqBody,
  IRegisterReqBody,
  IResetPasswordBody,
  ITokenPayload,
  IUnfollowReqParams,
  IUpdateMeReqBody,
  IVerifyEmailReqBody
} from '~/models/requests/Users.request'
import { ErrorWithStatus } from '~/models/Errors'
import User from '~/models/schemas/User.schema'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/message'
import databaseService from '~/services/database.services'
import HTTP_STATUS from '~/constants/httpStatus'
import { UserVerifyStatus } from '~/constants/enums'

export const loginController = async (req: Request<ParamsDictionary, any, ILoginReqBody>, res: Response) => {
  // lấy user từ req gửi từ validator
  const user = req.user as User

  //lấy user_id từ user
  const user_id = user._id as ObjectId

  // dùng user_id tạo ra access_token và refresh_token
  const result = await usersService.login({ user_id: user_id.toString(), verify: user.verify })
  // res access_token và refresh_token về cho client
  res.json({ message: USERS_MESSAGES.LOGIN_SUCCESS, result })
}

export const registerController = async (
  req: Request<ParamsDictionary, any, IRegisterReqBody>,
  res: Response
) => {
  // const { email, password, confirm_password,  } = req.body
  // nhét vô database
  const result = await usersService.register(req.body)
  res.json({ message: USERS_MESSAGES.REGISTER_SUCCESS, result })
}

export const logoutController = async (
  req: Request<ParamsDictionary, any, ILogoutReqBody>,
  res: Response
) => {
  // lấy refresh_token từ req.body
  const { refresh_token } = req.body
  //logout:  vào database xóa refresh_token này
  const result = await usersService.logout(refresh_token)

  res.json(result)
}

export const emailVerifyController = async (
  req: Request<ParamsDictionary, any, IVerifyEmailReqBody>,
  res: Response
) => {
  // nếu mà code vào đc đây nghĩa là email_verify_token hợp lệ
  // và mình đã lấy đc decoded_email_verify_token từ middleware emailVerifyTokenValidator

  const { user_id } = req.decoded_email_verify_token as ITokenPayload

  // dựa vào user_id tìm user và xem thử nó đã verify chưa
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (user === null) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  if (user.verify === UserVerifyStatus.Verified && user.email_verify_token === '') {
    return res.json(USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE)
  }

  // nếu mà xuống đc đây nghĩa là user chưa verify
  // mình sẽ update lại user đó
  const result = await usersService.verifyEmail(user_id)
  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  })
}

export const resendEmailVerifyController = async (req: Request, res: Response) => {
  // nếu vào đc đây nghĩa là access_token hợp lệ
  // và mình đã lấy đc decode_authorization từ middleware accessTokenValidator

  const { user_id } = req.decoded_authorization as ITokenPayload

  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

  if (user === null) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }
  // nếu mà ko khớp email_verify_token thì quăng lỗi
  if (user.email_verify_token !== req.body.email_verify_token) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INCORRECT,
      status: HTTP_STATUS.UNAUTHORIZED
    })
  }

  // nếu đã verify rồi thì ko cần verify nữa
  if (user.verify === UserVerifyStatus.Verified && user.email_verify_token === '') {
    return res.json({ message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE })
  }

  if (user.verify === UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_BANNED,
      status: HTTP_STATUS.FORBIDDEN
    })
  }

  // cập nhật lại user
  const result = await usersService.resendEmailVerify(user_id)

  return res.json({
    result
  })
}

export const forgotPasswordController = async (req: Request, res: Response) => {
  // lấy user_id từ user của req
  const { _id, verify } = req.user as User

  // dùng _id tìm và cập nhật lại user thêm vào forgot_password_token
  const result = await usersService.forgotPassword({
    user_id: (_id as ObjectId).toString(),
    verify: verify
  })

  return res.json(result)
}

export const verifyForgotPasswordController = async (req: Request, res: Response) => {
  return res.json({ message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, IResetPasswordBody>,
  res: Response
) => {
  // muốn cập nhật mật khấu mới thì cần user_id và password mới
  const { user_id } = req.decoded_forgot_password_token as ITokenPayload
  const { password } = req.body
  // cập nhật password mới cho user có user_id này
  const result = await usersService.resetPassword({ user_id, password })
  return res.json(result)
}

export const getMeController = async (req: Request, res: Response) => {
  // lấy thông tin user từ req.user
  const { user_id } = req.decoded_authorization as ITokenPayload
  // tiến hành vào database lấy thông tin user
  const user = await usersService.getMe(user_id)
  return res.json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: user
  })
}

export const updateMeController = async (
  req: Request<ParamsDictionary, any, IUpdateMeReqBody>,
  res: Response
) => {
  // muốn update thông tin của user thì cần user_id và thông tin ngta muốn update

  // lấy thông tin user từ req.user
  const { user_id } = req.decoded_authorization as ITokenPayload
  const { body } = req

  // giờ mình sẽ update user thông qua user_id này với body đc cho
  const result = await usersService.updateMe(user_id, body)

  return res.json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
    result: result
  })
}

export const getProfileController = async (
  req: Request<IGetProfileReqParams>,
  res: Response,
  next: NextFunction
) => {
  // muốn lấy thông tin user thì cần username

  const { username } = req.params //lấy username từ query params
  const result = await usersService.getProfile(username)
  return res.json({
    message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
    result: result
  })
}

export const followController = async (
  req: Request<ParamsDictionary, any, FollowReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as ITokenPayload //lấy user_id từ decoded_authorization của access_token trong req
  const { followed_user_id } = req.body //lấy followed_user_id từ req.body
  const result = await usersService.follow(user_id, followed_user_id)
  return res.json(result)
}

export const unfollowController = async (
  req: Request<IUnfollowReqParams>,
  res: Response,
  next: NextFunction
) => {
  // lấy ra user_id người muốn thực hiện hành động unfollow
  const { user_id } = req.decoded_authorization as ITokenPayload
  // lấy ra người mà mình muốn unfollow
  const { user_id: followed_user_id } = req.params
  // gọi hàm unfollow
  const result = await usersService.unfollow(user_id, followed_user_id)
  return res.json(result)
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, IChangePasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as ITokenPayload
  const { password } = req.body
  const result = await usersService.changePassword(user_id, password)
  return res.json(result)
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, IRefreshTokenReqBody>,
  res: Response
) => {
  const { refresh_token } = req.body
  const { user_id, verify, exp } = req.decoded_refresh_token as ITokenPayload

  const result = await usersService.refreshToken({ user_id, refresh_token, verify, exp })
  return res.json(result)
}

export const oAuthController = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.query
  const { access_token, refresh_token, new_user } = await usersService.oAuth(code as string)
  const urlRedirect = `${process.env.ClIENT_REDIRECT_CALLBACK}?access_token=${access_token}&refresh_token=${refresh_token}&new_user=${new_user}`
  return res.redirect(urlRedirect)
}
