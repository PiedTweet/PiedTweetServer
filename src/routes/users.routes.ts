import { Router } from 'express'
import {
  changePasswordController,
  emailVerifyController,
  followController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  oAuthController,
  refreshTokenController,
  resendEmailVerifyController,
  resetPasswordController,
  unfollowController,
  updateMeController,
  verifyForgotPasswordController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyTokenValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares'
import { registerController } from '~/controllers/users.controllers'
import { wrapAsync } from '~/utils/handlers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { UpdateMeReqBody } from '~/models/requests/Users.request'

const usersRouter = Router()

/*
des: đăng ký
path: /users/register
method: POST
body: {
  name, 
  email, 
  password,
  confirm_password
  data_of_birth
}
*/
usersRouter.post('/register', registerValidator, wrapAsync(registerController)) //đúng ra là phải thêm có validator

/*
des: đăng nhập 
path: /users/login
method: POST
body: { 
  email, 
  password
}
*/
usersRouter.post('/login', loginValidator, wrapAsync(loginController))

/*
des: đăng xuất
path: /users/logout
method: POST
header: {Authorization: Bearer <access_token>}
body: {
  refresh_token: string
}
*/
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))

/*
des: email verify token  
khi ng dùng đăng ký họ sẽ nhận đc mail có link dạng 
https://localhost:3000/users/verify-email?token=<email_verify_token>

nếu mà em nhấp vào link thì tạo ra req gửi email_verify_token lên server 

server kiểm tra email_verify_token có hợp lệ hay không? (tức là access_token có hợp lệ hay không)

thì từ decode_email_verify_token lấy ra user_id

và vào user_id đó để update email_verify_token thành '', verify = 1, update_at

path: /users/verify-email
method: POST
body: {
  email_verify_token: string  
}
*/
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapAsync(emailVerifyController))

/*
des: resend email verify token
khi mail thất lạc hoặc hết hạn thì ng dùng có nhu cầu resend lại email_verify_token

method: POST
path: /users/resend-verify-email
headers: {Authorization : "Bearer <access_token>"} //đăng nhập mới đc resend 
body: {}
*/
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapAsync(resendEmailVerifyController))

/*
des: khi ng dùng quên mật khẩu, họ gửi email để xin mình tạo cho họ forgot_password_token
method: POST
path: /users/forgot-password
body: {
  email: string
}
*/
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapAsync(forgotPasswordController))

/*
des: khi ng dùng nhấp vào link trong mail để reset password
họ sẽ gửi req kèm theo forgot_password_token lên 
 */

usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapAsync(verifyForgotPasswordController)
)

/*
des: reset password
path: '/reset-password'
method: POST
header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có auth đc
body: {forgot_password_token: string, password: string, confirm_password: string}
*/
usersRouter.post(
  '/reset-password',
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator,
  wrapAsync(resetPasswordController)
)

/*
des: get profile của mình
path: '/me'
method: get
header: {Authorization: Bearer <access_token>}
body: {}
*/
usersRouter.get('/me', accessTokenValidator, wrapAsync(getMeController))

/*
des: update profile của mình
path: '/me'
method: path
header: {Authorization: Bearer <access_token>}
body: {}
*/
usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  filterMiddleware<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'avatar',
    'username',
    'cover_photo'
  ]),
  updateMeValidator,
  wrapAsync(updateMeController)
)

/*
des: get profile của người khác
path: '/:username'
method: get
header: {}
body: {}
*/
usersRouter.get('/:username', wrapAsync(getProfileController))

/*
des: follow người khác
path: '/follow'
method: post
header: {Authorization: Bearer <access_token>}
body: {followed_user_id: string}
*/

usersRouter.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapAsync(followController)
)
// verifiedUserValidator: người dùng phải xác thực email rồi mới đc follow người khác
// followValidator: người dùng không thể follow chính mình,kiểm tra có đúng định dạng ObjectId, account có tồn tại hay không
// followController: kiểm tra xem đã follow chưa, tạo document vào collection followers

/*
des: unfollow người khác
path: '/unfollow/:user_id'
method: delete
header: {Authorization: Bearer <access_token>}
body: {}
*/
// DO DÙNG METHOD DELETE NÊN PHẢI TRUYỀN QUA PARAMS

usersRouter.delete(
  '/unfollow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapAsync(unfollowController)
)

/*
des: change password
path: '/change-password'
method: put
header: {Authorization: Bearer <access_token>}
body: {old_password: string, password: string, confirm_password: string}
*/
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapAsync(changePasswordController)
)

/*
des: resend refresh token
path: '/refresh-token'
method: post
header: {}
body: {refresh_token: string}
*/

usersRouter.post('/refresh-token', refreshTokenValidator, wrapAsync(refreshTokenController))

usersRouter.get('/oauth/google', wrapAsync(oAuthController))

export default usersRouter
