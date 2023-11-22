// file này dùng để định nghĩa lại những cái có sẵn

import { ITokenPayload } from './models/requests/Users.request'
import User from './models/schemas/User.schema'
import { Request } from 'express'

declare module 'express' {
  interface Request {
    user?: User
    decoded_authorization?: ITokenPayload
    decoded_refresh_token?: ITokenPayload
    decoded_email_verify_token?: ITokenPayload
    decoded_forgot_password_token?: ITokenPayload
  }
}
