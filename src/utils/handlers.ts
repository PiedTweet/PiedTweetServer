import { RequestHandler } from 'express'
import { Request, Response, NextFunction } from 'express'

/**
 *
 * @param func
 * @returns
 *
 */

// chuyển từ throw thành next(error)
export const wrapAsync = <P>(func: RequestHandler<P>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    // tạo cấu trục try catch
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
