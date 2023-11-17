import { NextFunction, Request, Response } from 'express'
import formidable from 'formidable'
import path from 'path'
import fs from 'fs'
import mime from 'mime'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { USERS_MESSAGES } from '~/constants/message'
import mediasServices from '~/services/medias.services'
import HTTP_STATUS from '~/constants/httpStatus'

// IMAGE

export const uploadImageController = async (req: Request, res: Response) => {
  const url = await mediasServices.uploadImage(req)

  return res.json({
    result: url,
    message: USERS_MESSAGES.UPLOAD_SUCCESS
  })
}

export const serveImageController = async (req: Request, res: Response, next: NextFunction) => {
  const { filename } = req.params

  res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, filename), (err) => {
    if (err) {
      res.status((err as any).status).send('Not found image')
    }
  })
}

// VIDEO

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediasServices.uploadVideo(req) //uploadVideo chưa làm
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result: url
  })
}

//khỏi async vì có đợi gì đâu
export const serveVideoStreamController = (req: Request, res: Response, next: NextFunction) => {
  const { filename } = req.params //lấy filename từ param string

  const range = req.headers.range //lấy range từ header

  // lấy kích thước tối đa của video
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, filename) //lấy đường dẫn của video từ backend của mình

  // console.log(fs.statSync(videoPath)); lấy ra trạng thái của file

  const videoSize = fs.statSync(videoPath).size //lấy size của video

  // nếu không có range thì yêu cầu range

  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Requires Range header')
  }

  const CHUNK_SIZE = 10 ** 6 //1MB

  const start = Number(range.replace(/\D/g, '')) //lấy số từ range

  const end = Math.min(start + CHUNK_SIZE, videoSize - 1) //lấy min của start + chunk_size và videoSize - 1
  //dung lượng thực tế của video
  const contentLength = end - start + 1 //lấy độ dài của video

  const contentType = mime.getType(videoPath) || 'video/*' //lấy kiểu của video

  // định dạng header
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }

  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers) //trả về header
  const videoStream = fs.createReadStream(videoPath, { start, end }) //tạo stream của video
  videoStream.pipe(res) //pipe videoStream vào res
}
