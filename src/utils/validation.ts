import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationChain, Location, FieldValidationError } from 'express-validator'
import { RunnableValidationChains, Schema, checkSchema } from 'express-validator/src/middlewares/schema'
import { EntityError, ErrorWithStatus } from '~/models/Errors'
import { schemaToArray } from './commons'
import { USERS_MESSAGES } from '~/constants/message'

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
export const validate = (schema: Schema, defaultLocations?: Location[] | undefined): Middleware => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const validation: RunnableValidationChains<ValidationChain> = checkSchema(schema, defaultLocations)

    // chạy qua tất cả các ValidationChain trong validation
    // NẾU TỪNG CHAIN CÓ LỖI THÌ SẼ TRUYỀN VÀO REQ và đi tiếp
    await validation.run(req)

    const allErrors = validationResult(req)
    console.log(allErrors)

    // map lại error của tất cả các chain lại (KỂ CẢ KHÔNG PHẢI TỪ validation chain)
    const allErrorMappedObject = allErrors.mapped()

    const extraPropsErrorObject = getExtraPropsErrorObject(schema, req.body)
    if (extraPropsErrorObject !== undefined) allErrorMappedObject.extra_props = extraPropsErrorObject

    if (allErrors.isEmpty()) {
      return next()
    }

    // declare
    const entityError = new EntityError({ errors: {} })

    // xử lý những error gửi từ validation chain (HIỆN TẠI KHÔNG CÓ STATUS NHƯNG ĐÚNG LÀ 422)
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

/**
 * Hàm này trả về một object chứa các error của các properties không được phép gửi lên
 * @returns JSON || undefined
 * mới chỉ hỗ trợ ở body !!!
 */
const getExtraPropsErrorObject = (schema: Schema, requestBody: any, defaultLocations?: Location | 'body') => {
  const arraySchema = schemaToArray(schema)

  // check xem có những properties nào không được phép gửi lên không
  const extraPropsArray = Object.keys(requestBody).filter((prop) => !arraySchema.includes(prop))

  let extraPropsErrorMessage = undefined

  if (extraPropsArray.length) {
    extraPropsErrorMessage = `${USERS_MESSAGES.INVALID_PROPERTIES} ${extraPropsArray.join(', ')}`
  }

  if (extraPropsErrorMessage === undefined) {
    return undefined
  }

  const extraPropsErrorObject = {
    msg: extraPropsErrorMessage,
    location: defaultLocations
  } as FieldValidationError

  return extraPropsErrorObject
}
