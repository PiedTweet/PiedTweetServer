import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import { EntityError, ErrorWithStatus } from '~/models/Errors'

type Middleware = {
  (req: Request, res: Response, next: NextFunction): Promise<void>
}

/**
 * This function return a middleware that have handle all the 'validation'.
 * If the error come from 'validation'(mean have no status), will be assigned status 422 and combine
 * with other 422 error
 * @param validation
 * @returns Middleware
 */
export const validate = (validation: RunnableValidationChains<ValidationChain>): Middleware => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // chạy qua tất cả các ValidationChain trong validation
    // NẾU TỪNG CHAIN CÓ LỖI THÌ SẼ TRUYỀN VÀO REQ và đi tiếp
    await validation.run(req)

    const allErrors = validationResult(req)

    if (allErrors.isEmpty()) {
      return next()
    }

    // map lại error của tất cả các chain lại (KỂ CẢ KHÔNG PHẢI TỪ validation chain)
    const allErrorMappedObject = allErrors.mapped()

    const entityError = new EntityError({ errors: {} })

    // xử lý những error gửi từ validation chain (KHÔNG CÓ STATUS 422)
    // duyệt qua từng key của allErrorMappedObject
    for (const key in allErrorMappedObject) {
      // vào trong từng key của allErrorMappedObject tìm kiếm và destructuring ra msg
      const { msg } = allErrorMappedObject[key]

      // nếu msg có dạng ErrorWithStatus và status !== 422 thì ném tiếp về error handler tổng
      if (msg instanceof ErrorWithStatus && msg.status !== 422) {
        return next(msg)
      }

      // xuống đây thì chắc chắn lỗi không có status hoặc status === 422
      // lưu tất cả vào entityError
      entityError.errors[key] = msg
    }

    next(entityError)
  }
}
