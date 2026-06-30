import { Controller, Get, Query, Res, StreamableFile, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { OptimizeImageDto } from './dto/optimize-image.dto';

@Controller('image')
export class ImageController {
  @Get()
  async getOptimizedImage(
    @Query() query: OptimizeImageDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { url, w, q } = query;
    const width = parseInt(w, 10);
    const quality = parseInt(q, 10);

    if (isNaN(width) || isNaN(quality)) {
      throw new NotFoundException('Invalid width or quality parameters');
    }

    // Clean prefix like /uploads/ or /images/ if they exist to prevent folder escapes
    const cleanUrl = url.replace(/^\/?(uploads|images)\//, '');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const sourceFilePath = path.join(uploadsDir, cleanUrl);

    // Verify source file exists
    if (!fs.existsSync(sourceFilePath)) {
      throw new NotFoundException(`Source image ${cleanUrl} not found`);
    }

    // Construct Cache File Path
    const fileParsed = path.parse(cleanUrl);
    const cacheFilename = `${fileParsed.name}-${width}-${quality}.webp`;
    const cacheDir = path.join(uploadsDir, '.cache');
    const cacheFilePath = path.join(cacheDir, cacheFilename);

    // Check Cache Hit
    try {
      await fs.promises.access(cacheFilePath, fs.constants.R_OK);
    } catch {
      // Cache Miss: Perform optimization and save to cache
      const tempFilePath = `${cacheFilePath}.tmp`;
      try {
        await sharp(sourceFilePath)
          .resize(width, null, { withoutEnlargement: true })
          .webp({ quality })
          .toFile(tempFilePath);

        await fs.promises.rename(tempFilePath, cacheFilePath);
      } catch (err) {
        console.error('Sharp Image Processing Error:', err);
        // Fallback: serve original if sharp fails
        res.set({ 'Content-Type': 'image/png' }); // or match original mimetype
        return new StreamableFile(fs.createReadStream(sourceFilePath));
      }
    }

    res.set({ 
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable'
    });
    return new StreamableFile(fs.createReadStream(cacheFilePath));
  }
}
