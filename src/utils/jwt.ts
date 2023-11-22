import jwt from 'jsonwebtoken'
import { ITokenPayload } from '~/models/requests/Users.request'

export const signToken = ({
  payload,
  privateKey,
  options = { algorithm: 'HS256' }
}: {
  payload: string | object | Buffer
  privateKey: string
  options?: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (err: any, token: any) => {
      if (err) reject(err)

      resolve(token as string)
    })
  })
}

export const verifyToken = ({
  token,
  publicOrSecretKey,
  options = { algorithms: ['HS256'] }
}: {
  token: string
  publicOrSecretKey: string
  options?: jwt.VerifyOptions
}) => {
  return new Promise<ITokenPayload>((resolve, reject) => {
    jwt.verify(token, publicOrSecretKey, options, (err: any, decoded: any) => {
      // decoded là payload đã decode
      if (err) throw reject(err)
      // truyền tiếp xuống controller
      resolve(decoded as ITokenPayload)
    })
  })
}
