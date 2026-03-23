import sharp from "sharp";
import { readdir, stat } from "fs/promises";
import { join, extname, basename, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = join(__dirname, "../../artifacts/mercanto/public/images");
const MAX_WIDTH = 1200;
const QUALITY = 80;
const SUPPORTED_EXTENSIONS = [".png", ".jpg", ".jpeg"];

async function optimizeImages() {
  console.log(`Optimizando imágenes en: ${IMAGES_DIR}`);

  const files = await readdir(IMAGES_DIR);
  const imageFiles = files.filter(f => SUPPORTED_EXTENSIONS.includes(extname(f).toLowerCase()));

  if (imageFiles.length === 0) {
    console.log("No se encontraron imágenes para optimizar.");
    return;
  }

  let optimized = 0;
  let skipped = 0;

  for (const file of imageFiles) {
    const inputPath = join(IMAGES_DIR, file);
    const nameWithoutExt = basename(file, extname(file));
    const outputPath = join(IMAGES_DIR, `${nameWithoutExt}.webp`);

    const [inputStat] = await Promise.all([stat(inputPath)]).catch(() => [null]);
    if (!inputStat) {
      console.log(`  ⚠ No se pudo leer: ${file}`);
      continue;
    }

    await sharp(inputPath)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(outputPath);

    const outputStat = await stat(outputPath);
    const saved = (((inputStat.size - outputStat.size) / inputStat.size) * 100).toFixed(1);

    console.log(
      `  ✓ ${file} → ${nameWithoutExt}.webp` +
      ` (${(inputStat.size / 1024).toFixed(0)}KB → ${(outputStat.size / 1024).toFixed(0)}KB, −${saved}%)`
    );
    optimized++;
  }

  console.log(`\nListo: ${optimized} imágenes optimizadas, ${skipped} omitidas.`);
}

optimizeImages().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
