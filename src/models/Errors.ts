import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/message'

type ErrorType = Record<
  string,
  {
    msg: string
    [key: string]: any //muốn thêm bao nhiêu cũng đc
  }
>

export class ErrorWithStatus {
  message: string
  status: number
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

// EntityError là cho thằng 422
export class EntityError extends ErrorWithStatus {
  errors: ErrorType

  constructor({
    message = USERS_MESSAGES.VALIDATION_ERROR,
    errors
  }: {
    message?: string
    errors: ErrorType
  }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY })
    this.errors = errors
  }
}
