import path from 'path'
import fs from 'fs'
import { Request } from 'express'
import formidable from 'formidable'
import { File } from 'formidable'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'

export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true //cho phép tạo folder nested vào nhau
        //uploads/image/bla bla bla
      }) //mkdirSync: giúp tạo thư mục
    }
  })
}

/**
 * Get file name from file and remove all '.' in name
 * @param filename
 * @returns string
 */
export const getFileNameFromFile = (filename: string): string => {
  const nameArr = filename.split('.')
  nameArr.pop()
  return nameArr.join('')
}

// prettier-ignore
export const handleUploadImage = async (req: Request): Promise<File[]> => {
  const form = formidable({
    uploadDir: path.resolve(UPLOAD_IMAGE_TEMP_DIR), //tức là formidable sẽ LƯU FILE vào đây trước khi xử lý
    maxFiles: 4, //tối đa bao nhiêu
    keepExtensions: true, //có lấy đuôi mở rộng không .png, .jpg
    maxFileSize: 300 * 1024 *4, //tối đa bao nhiêu byte, 300kb
    
    filter: function ({ name, originalFilename, mimetype }) { //xài option filter để kiểm tra file có phải là image không
      //name: name|key truyền vào của <input name = bla bla>
      //originalFilename: tên file gốc
      //mimetype: kiểu file vd: image/png
      // console.log(name, originalFilename, mimetype) //log để xem, nhớ comment

      const valid = (name === 'image' && Boolean(mimetype?.includes('image/')))


      //mimetype? nếu là string thì check, k thì thôi
      //ép Boolean luôn, nếu k thì valid sẽ là boolean | undefined

      //nếu sai valid thì dùng form.emit để gữi lỗi
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
        //as any vì bug này formidable chưa fix, khi nào hết thì bỏ as any
      }
      //nếu đúng thì return valid
      return valid
    }
  })


    // form.parse về thành promise
    // files là object có dạng giống hình test code cuối cùng
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err) //để ý dòng này

      if (!files.image) {
        return reject(new Error('Image is empty'))
      }

      return resolve(files.image as File[])//files.image là array, lấy phần tử đầu tiên
    })
  })
}

//làm lấy đuôi mở rộng của file
export const getExtension = (filename: string) => {
  const nameArr = filename.split('.')
  return nameArr[nameArr.length - 1]
}

export const handleUploadVideo = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_DIR, //vì video nên mình không đi qua bước xử lý trung gian nên mình sẽ k bỏ video vào temp
    maxFiles: 1, //tối đa bao nhiêu
    // keepExtensions: true, //có lấy đuôi mở rộng không .png, .jpg "nếu file có dạng video_demo.app.mp4 thì lỗi, nên mình sẽ xử lý riêng
    maxFileSize: 50 * 1024 * 1024 * 50, //tối đa bao nhiêu byte, 50MB
    //xài option filter để kiểm tra file có phải là video không
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && Boolean(mimetype?.includes('video/'))
      //nếu sai valid thì dùng form.emit để gữi lỗi
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
        //as any vì bug này formidable chưa fix, khi nào hết thì bỏ as any
      }
      return valid
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      //files.video k phải image nha
      if (!files.video) {
        return reject(new Error('video is empty'))
      }
      // vì mình đã tắt keepExtensions nên mình sẽ phải tự xử lý
      //vì k xài keepExtensions nên file sau khi xử lý xong
      // của mình sẽ k có đuôi mở rộng, mình sẽ rename nó để lắp đuôi cho nó

      // trong file{originalFilename: string, newFilename: string, filepath: string}
      // thì bây giờ mình cần lấy đuôi của originalFilename (bởi vì nó còn đuôi) rồi mình sẽ gắn lại vô cái newFilename

      const videos = files.video as File[] //lấy ra danh sách các video đã upload

      videos.forEach((video) => {
        //lấy đuôi mở rộng của file cũ
        const ext = getExtension(video.originalFilename as string)
        //filepath là đường dẫn đến tên file mới đã mất đuôi mở rộng do k dùng keepExtensions

        // lắp đuôi vào tên mới
        fs.renameSync(video.filepath, `${video.filepath}.${ext}`) //rename lại đường dẫn tên file để thêm đuôi
        video.newFilename += '.' + ext //newFilename là tên file mới đã mất đuôi mở rộng do k dùng keepExtensions
        //lưu lại tên file mới để return ra bên ngoài, thì method uploadVideo khỏi cần thêm đuôi nữa
      })

      resolve(files.video as File[])
    })
  })
}
