import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/entities/enum/users.enum';
import { S3Service } from '../s3/s3.service';
import { PresignedUrlDto } from './dto/presigned-url.dto';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const uploadsDir = resolve(__dirname, '..', '..', '..', 'uploads', 'courses');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

@ApiTags('Uploads')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
@Controller('uploads')
@UseGuards(RolesGuard)
export class UploadController {
  constructor(private readonly s3Service: S3Service) {}
  @ApiBearerAuth() // override class-level
  @Post('course-thumbnail')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Upload a course thumbnail image' })
  @ApiResponse({ status: 201, description: 'Thumbnail uploaded.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpg, png, webp, max 2MB)',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (_req, file, callback) => {
          const ext = extname(file.originalname).toLowerCase();
          const name = randomUUID() + ext;
          callback(null, name);
        },
      }),
      limits: { fileSize: MAX_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIMES.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_MIMES.join(', ')}`,
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  uploadThumbnail(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const relativePath = `/uploads/courses/${file.filename}`;
    return {
      url: relativePath,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @ApiBearerAuth() // override class-level
  @Post('presigned-url')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Generate a presigned PUT URL for video upload to S3',
  })
  @ApiBody({ type: PresignedUrlDto })
  @ApiResponse({ status: 201, description: 'Presigned URL generated.' })
  async generatePresignedUrl(@Body() dto: PresignedUrlDto) {
    const ext = extname(dto.fileName);
    const key = `videos/${randomUUID()}${ext}`;
    const uploadUrl = await this.s3Service.generatePresignedPutUrl(
      key,
      dto.contentType,
    );
    const bucket = process.env.S3_MEDIA_BUCKET ?? 'synapsisforge-media';
    const region = process.env.AWS_REGION ?? 'eu-south-1';
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return { uploadUrl, key, publicUrl };
  }
}
