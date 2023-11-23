//************  Request / Response : CHÚ Ý LÀ XÀI CỦA EXPRESS *******************/
import { NextFunction, Request, Response } from 'express'
import { USERS_MESSAGES } from '~/constants/message'
import { ParamSchema, Schema, checkSchema } from 'express-validator'
import { ErrorWithStatus } from '~/models/Errors'
import usersService from '~/services/users.services'
import { validate } from '~/utils/validation'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { JsonWebTokenError } from 'jsonwebtoken'
import HTTP_STATUS from '~/constants/httpStatus'
import _, { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { ITokenPayload } from '~/models/requests/Users.request'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { REGEX_USERNAME } from '~/constants/regex'

const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USERS_MESSAGES.IMAGE_URL_LENGTH_MUST_BE_FROM_1_TO_400
  }
}

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 8,
      max: 50
    },
    errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
  }
}

const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 8,
      max: 50
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
      }
      return true
    }
  }
}

const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 100
    },
    errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
  }
}

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    }
  },
  errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_BE_ISO8601
}

const userIdSchema: ParamSchema = {
  custom: {
    options: async (value, { req }) => {
      // check value có phải ObjectId hay không
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.INVALID_USER_ID,
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      // kiểm tra xem người dùng có tồn tại hay không
      const user = await databaseService.users.findOne({ _id: new ObjectId(value) })

      if (user === null) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      // kiểm tra xem người dùng có tự follow chính mình hay không
      if (user._id.toString() === req.decoded_authorization.user_id) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.CANNOT_FOLLOW_YOURSELF,
          status: HTTP_STATUS.FORBIDDEN
        })
      }
      return true
    }
  }
}

const loginValidatorSchema: Schema = {
  email: {
    trim: true,
    notEmpty: {
      errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
    },
    isEmail: {
      errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
    },
    custom: {
      options: async (value, { req }) => {
        // dựa vào email và password tìm đối tượng tương ứng
        const user = await databaseService.users.findOne({
          email: value,
          password: hashPassword(req.body.password)
        })
        if (user === null) {
          throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
        }
        req.user = user //  lưu user vào req để dùng ở loginController
        return true
      }
    }
  },
  password: {
    trim: true,
    notEmpty: {
      errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
    },
    isString: {
      errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
    },
    isLength: {
      options: {
        min: 8,
        max: 50
      },
      errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
    },
    isStrongPassword: {
      options: {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      },
      errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
    }
  }
}
export const loginValidator = validate(loginValidatorSchema, ['body'])

const registerValidatorSchema: Schema = {
  name: nameSchema,
  email: {
    notEmpty: {
      errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
    },
    isEmail: {
      errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
    },
    trim: true,
    custom: {
      options: async (value, { req }) => {
        console.log('đã chạy tới checkSchema của register')
        const isExist = await usersService.checkEmailExist(value)
        if (isExist) {
          throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS)
        }
        return true
      }
    }
  },
  password: passwordSchema,
  confirm_password: confirmPasswordSchema,
  date_of_birth: dateOfBirthSchema
}
export const registerValidator = validate(registerValidatorSchema, ['body'])

// ??????? làm sao để implement
type decoded_authorization_Type = {
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
  iat: number
  exp: number
}

const accessTokenValidatorSchema: Schema = {
  Authorization: {
    trim: true,
    custom: {
      options: async (value, { req }) => {
        const accessToken = value.split(' ')[1]
        if (!accessToken) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        // nếu xuống đc đây thì tức là access_token có rồi
        // cần verify access_token và lấy payload ra lưu lại trong req
        try {
          const decoded_authorization = await verifyToken({
            token: accessToken,
            publicOrSecretKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
          })
          // sau khi verify thành công ta đc payload của access_token: decoded_authorization
          ;(req as Request).decoded_authorization = decoded_authorization
          // console.log(decoded_authorization)
        } catch (error) {
          throw new ErrorWithStatus({
            message: capitalize((error as JsonWebTokenError).message),
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        return true
      }
    }
  }
}
export const accessTokenValidator = validate(accessTokenValidatorSchema, ['headers'])

const refreshTokenValidatorSchema: Schema = {
  refresh_token: {
    notEmpty: {
      errorMessage: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
    },
    trim: true,
    custom: {
      options: async (value, { req }) => {
        // verify refresh_token gửi lên và lấy payload ra lưu lại trong req
        try {
          const [decoded_refresh_token, refresh_token] = await Promise.all([
            verifyToken({
              token: value,
              publicOrSecretKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
            }),
            databaseService.refreshTokens.findOne({
              token: value
            })
          ])

          if (refresh_token === null) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.REFRESH_TOKEN_IS_NOT_EXIST,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
          ;(req as Request).decoded_refresh_token = decoded_refresh_token
        } catch (error) {
          // chỗ này chủ yếu để xử lý lỗi của jwt "do không có status"
          if (error instanceof JsonWebTokenError) {
            throw new ErrorWithStatus({
              message: capitalize((error as JsonWebTokenError).message),
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
          // nếu ko phải lỗi của jwt thì vẫn quăng ra validate bth
          throw error
        }
        return true
      }
    }
  }
}
export const refreshTokenValidator = validate(refreshTokenValidatorSchema, ['body'])

const emailVerifyTokenValidatorSchema: Schema = {
  email_verify_token: {
    trim: true,
    custom: {
      options: async (value, { req }) => {
        // kiểm tra ng dùng có truyền lên email_verify_token hay ko
        if (!value) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        // verify email_verify_token để lấy decoded_email_verify_token
        try {
          const decoded_email_verify_token = await verifyToken({
            token: value,
            publicOrSecretKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
          })

          // sau khi verify thành công ta đc payload của email_verify_token: decoded_email_verify_token
          ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
        } catch (error) {
          // chỗ này chủ yếu để xử lý lỗi của jwt "do không có status"
          if (error instanceof JsonWebTokenError) {
            throw new ErrorWithStatus({
              message: capitalize((error as JsonWebTokenError).message),
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
          //nếu ko phải lỗi của jwt thì vẫn quăng ra validate bth
          throw error
        }
        return true
      }
    }
  }
}
export const emailVerifyTokenValidator = validate(emailVerifyTokenValidatorSchema, ['body'])

const forgotPasswordValidatorSchema: Schema = {
  email: {
    notEmpty: {
      errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
    },
    isEmail: {
      errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
    },
    trim: true,
    custom: {
      options: async (value, { req }) => {
        const user = await databaseService.users.findOne({ email: value })
        if (user === null) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.USER_NOT_FOUND,
            status: HTTP_STATUS.NOT_FOUND
          })
        }
        req.user = user
        return true
      }
    }
  }
}
export const forgotPasswordValidator = validate(forgotPasswordValidatorSchema, ['body'])

const verifyForgotPasswordTokenValidatorSchema: Schema = {
  forgot_password_token: {
    trim: true,
    custom: {
      options: async (forgotPasswordTokenFromRequest, { req }) => {
        // kiểm tra ng dùng có truyền lên forgot_password_token hay ko
        if (!forgotPasswordTokenFromRequest) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        // verify forgot_password_token để lấy decoded_forgot_password_token
        try {
          const decoded_forgot_password_token = await verifyToken({
            token: forgotPasswordTokenFromRequest,
            publicOrSecretKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
          })

          // sau khi verify ta đc payload của forgot_password_token: decoded_forgot_password_token
          ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token
          const { user_id } = decoded_forgot_password_token

          // dựa vào user_id để tìm user
          const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
          // nếu user === null thì ném lỗi user not found
          if (user === null) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.USER_NOT_FOUND,
              status: HTTP_STATUS.NOT_FOUND
            })
          }

          if (user.forgot_password_token !== forgotPasswordTokenFromRequest) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INCORRECT,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
        } catch (error) {
          // chỗ này chủ yếu để xử lý lỗi của jwt "do không có status"
          if (error instanceof JsonWebTokenError) {
            throw new ErrorWithStatus({
              message: capitalize((error as JsonWebTokenError).message),
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
          //nếu ko phải lỗi của jwt thì vẫn quăng ra validate bth
          throw error
        }
        return true
      }
    }
  }
}
export const verifyForgotPasswordTokenValidator = validate(verifyForgotPasswordTokenValidatorSchema, ['body'])

const resetPasswordValidatorSchema: Schema = {
  password: passwordSchema,
  confirm_password: confirmPasswordSchema
}
export const resetPasswordValidator = validate(resetPasswordValidatorSchema, ['body'])

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  // kiểm tra xem user đã verify hay chưa
  const { verify } = req.decoded_authorization as ITokenPayload
  if (verify === 0) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_VERIFIED,
      status: HTTP_STATUS.FORBIDDEN //403
    })
  }
  next()
}

const updateMeValidatorSchema: Schema = {
  name: {
    optional: true, //đc phép có hoặc k
    ...nameSchema, //phân rã nameSchema ra
    notEmpty: undefined //ghi đè lên notEmpty của nameSchema
  },
  date_of_birth: {
    optional: true, //đc phép có hoặc k
    ...dateOfBirthSchema, //phân rã nameSchema ra
    notEmpty: undefined //ghi đè lên notEmpty của nameSchema
  },
  bio: {
    optional: true,
    isString: {
      errorMessage: USERS_MESSAGES.BIO_MUST_BE_A_STRING ////messages.ts thêm BIO_MUST_BE_A_STRING: 'Bio must be a string'
    },
    trim: true, //trim phát đặt cuối, nếu k thì nó sẽ lỗi validator
    isLength: {
      options: {
        min: 1,
        max: 200
      },
      errorMessage: USERS_MESSAGES.BIO_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm BIO_LENGTH_MUST_BE_LESS_THAN_200: 'Bio length must be less than 200'
    }
  },
  //giống bio
  location: {
    optional: true,
    isString: {
      errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_A_STRING ////messages.ts thêm LOCATION_MUST_BE_A_STRING: 'Location must be a string'
    },
    trim: true,
    isLength: {
      options: {
        min: 1,
        max: 200
      },
      errorMessage: USERS_MESSAGES.LOCATION_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm LOCATION_LENGTH_MUST_BE_LESS_THAN_200: 'Location length must be less than 200'
    }
  },
  //giống location
  website: {
    optional: true,
    isString: {
      errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_A_STRING ////messages.ts thêm WEBSITE_MUST_BE_A_STRING: 'Website must be a string'
    },
    trim: true,
    isLength: {
      options: {
        min: 1,
        max: 200
      },

      errorMessage: USERS_MESSAGES.WEBSITE_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm WEBSITE_LENGTH_MUST_BE_LESS_THAN_200: 'Website length must be less than 200'
    }
  },
  username: {
    optional: true,
    isString: {
      errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_A_STRING ////messages.ts thêm USERNAME_MUST_BE_A_STRING: 'Username must be a string'
    },
    trim: true,
    custom: {
      options: async (value, { req }) => {
        if (REGEX_USERNAME.test(value) === false) {
          throw new Error(USERS_MESSAGES.USERNAME_IS_INVALID)
        }
        // tìm user bằng cái username người dùng muốn cập nhật
        const user = await databaseService.users.findOne({ username: value })

        if (user) {
          throw new Error(USERS_MESSAGES.USERNAME_ALREADY_EXISTS)
        }
        return true
      }
    }
  },
  avatar: imageSchema,
  cover_photo: imageSchema
}
export const updateMeValidator = validate(updateMeValidatorSchema, ['body'])

const followValidatorSchema: Schema = {
  followed_user_id: {
    notEmpty: {
      errorMessage: USERS_MESSAGES.FOLLOWED_USER_ID_IS_REQUIRED
    },
    trim: true,
    custom: userIdSchema
  }
}
export const followValidator = validate(followValidatorSchema, ['body'])

const unfollowValidatorSchema: Schema = {
  user_id: userIdSchema
}
export const unfollowValidator = validate(unfollowValidatorSchema, ['params'])

const changePasswordValidatorSchema: Schema = {
  old_password: {
    ...passwordSchema,
    custom: {
      // Ở ĐÂY OPTIONS LÀ 1 HÀM ASYNC CALLBACK NÊN KHI ĐC GỌI LẠI THÌ value đại diện cho old_password
      options: async (value, { req }) => {
        const { user_id } = req.decoded_authorization as ITokenPayload

        // tìm user bằng user_id và password
        const user = await databaseService.users.findOne({
          _id: new ObjectId(user_id)
        })

        if (user === null) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.USER_NOT_FOUND,
            status: HTTP_STATUS.NOT_FOUND
          })
        }
        // nếu user tồn tại thì kiểm tra old_password có đúng với password trong db hay không
        const { password } = user
        if (password !== hashPassword(value)) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.OLD_PASSWORD_IS_INCORRECT,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        return true
      }
    }
  },
  password: passwordSchema,
  confirm_password: confirmPasswordSchema
}
export const changePasswordValidator = validate(changePasswordValidatorSchema, ['body'])
