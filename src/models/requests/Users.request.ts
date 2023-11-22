import { ParamsDictionary } from 'express-serve-static-core'
import { JwtPayload } from 'jsonwebtoken'
import { UserVerifyStatus } from '~/constants/enums'

export interface IRegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface ILoginReqBody {
  email: string
  password: string
}

export interface ILogoutReqBody {
  refresh_token: string
}

export interface IVerifyEmailReqBody {
  email_verify_token: string
}

export interface ITokenPayload extends JwtPayload {
  user_id: string
  refresh_token: string
  verify: UserVerifyStatus
  exp: number
  iat: number
}

export interface IResetPasswordBody {
  password: string
  confirm_password: string
  forgot_password_token: string
}

export interface IUpdateMeReqBody {
  name?: string
  date_of_birth?: string //vì ngta truyền lên string dạng ISO8601, k phải date
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}
//vì đây là route patch nên ngta truyền thiếu 1 trong các prop trên cũng k sao

export interface IGetProfileReqParams extends ParamsDictionary {
  username: string
}

export interface FollowReqBody {
  followed_user_id: string
}

export interface IUnfollowReqParams extends ParamsDictionary {
  user_id: string
}

export interface IChangePasswordReqBody {
  old_password: string
  password: string
  confirm_password: string
}

export interface IRefreshTokenReqBody {
  refresh_token: string
}
