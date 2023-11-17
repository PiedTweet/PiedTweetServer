import { NextFunction, Request, Response } from 'express'
import { omit } from 'lodash'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.log('error handle tổng nè')
  console.log(err)

  // lỗi từ các nơi sẽ dồn về đây

  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json(omit(err, 'status'))
  }

  // nếu không lọt vào if ở trên thì tức là error này tức là lỗi mặc định

  // name, message, stack mà 3 thằng thằng này có enumerable = false
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true })
  })

  console.log('lỗi internal server error')
  console.log(err)
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfo: omit(err, ['stack'])
  })
}
