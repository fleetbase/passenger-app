/**
 * Makes every iOS and Android icon size from one square image, so a client build ships its own
 * icon instead of Passenger's:
 *
 *   yarn generate:app-icon                    from brand/app-icon.png
 *   yarn generate:app-icon path/to/icon.png   from another file
 *
 * The image should be at least 1024×1024. It's cropped to a square from the centre if it isn't
 * one, and transparency is filled with white, because the App Store refuses icons with it. Every
 * file is a plain 24-bit PNG (32-bit for the round icon, which is transparent outside the circle).
 *
 * It writes:
 *   ios/PassengerApp/Images.xcassets/AppIcon.appiconset   every size Contents.json lists
 *   android/app/src/main/res/mipmap-*                     ic_launcher, ic_launcher_round, and the
 *                                                         adaptive icon's foreground
 *   android/app/src/main/res/values/ic_launcher_background.xml
 *
 * Android 8 and later show the adaptive icon: the whole image as the foreground layer, which the
 * launcher masks to a circle, squircle or rounded square, cutting about a sixth off each side. Keep
 * the important part in the middle. The background layer is the image's top-left colour, so any
 * edge the mask leaves shows the same colour.
 *
 * Needs ImageMagick (`magick`, or `convert` from ImageMagick 6).
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

/** Android density buckets: the legacy icon is 48dp, the adaptive layers 108dp. */
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

function imageMagick() {
    for (const command of ['magick', 'convert']) {
        const probe = spawnSync(command, ['-version'], { encoding: 'utf8' });
        if (probe.status === 0 && /ImageMagick/.test(probe.stdout)) return command;
    }
    throw new Error('ImageMagick is needed: install it (for example `brew install imagemagick`), then run this again.');
}

function run(im, args) {
    const result = spawnSync(im, args, { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`${im} ${args.join(' ')} failed: ${result.stderr || result.error}`);
    return result.stdout;
}

/** `root` is the app's folder; tests point it at a copy. */
function generate(source, root = ROOT) {
    source = source ?? path.join(root, 'brand/app-icon.png');
    const iconSet = path.join(root, 'ios/PassengerApp/Images.xcassets/AppIcon.appiconset');
    const res = path.join(root, 'android/app/src/main/res');
    if (!fs.existsSync(source)) throw new Error(`No icon at ${path.relative(root, source)}: add a square PNG, at least 1024×1024.`);
    const im = imageMagick();
    const [width, height] = run(im, [source, '-format', '%w %h', 'info:']).trim().split(' ').map(Number);
    if (Math.min(width, height) < 1024)
        console.warn(`[app-icon] ${width}×${height} is under 1024×1024: the App Store icon will look soft.`);

    // A square, opaque master: every size is made from it.
    const master = path.join(root, '.app-icon-master.png');
    const side = Math.min(width, height);
    run(im, [
        source,
        '-gravity',
        'center',
        '-crop',
        `${side}x${side}+0+0`,
        '+repage',
        '-background',
        'white',
        '-alpha',
        'remove',
        '-alpha',
        'off',
        master,
    ]);
    const resize = (size, out, extra = []) => run(im, [master, '-filter', 'Lanczos', '-resize', `${size}x${size}!`, ...extra, out]);

    try {
        // iOS: each file Contents.json names, at its pixel size.
        const contents = JSON.parse(fs.readFileSync(path.join(iconSet, 'Contents.json'), 'utf8'));
        const ios = new Map();
        for (const image of contents.images) {
            if (!image.filename) continue;
            ios.set(image.filename, Math.round(parseFloat(image.size) * parseFloat(image.scale)));
        }
        for (const [file, size] of ios) resize(size, `PNG24:${path.join(iconSet, file)}`, ['-alpha', 'off']);

        // Android: the legacy square and round icons, and the adaptive foreground.
        for (const [density, scale] of Object.entries(DENSITIES)) {
            const dir = path.join(res, `mipmap-${density}`);
            fs.mkdirSync(dir, { recursive: true });
            const legacy = Math.round(48 * scale);
            resize(legacy, `PNG24:${path.join(dir, 'ic_launcher.png')}`);
            const c = legacy / 2;
            run(im, [
                master,
                '-filter',
                'Lanczos',
                '-resize',
                `${legacy}x${legacy}!`,
                '(',
                '-size',
                `${legacy}x${legacy}`,
                'xc:black',
                '-fill',
                'white',
                '-draw',
                `circle ${c - 0.5},${c - 0.5} ${c - 0.5},0`,
                ')',
                '-alpha',
                'off',
                '-compose',
                'CopyOpacity',
                '-composite',
                `PNG32:${path.join(dir, 'ic_launcher_round.png')}`,
            ]);
            resize(Math.round(108 * scale), `PNG24:${path.join(dir, 'ic_launcher_foreground.png')}`);
        }
        const corner = run(im, [master, '-depth', '8', '-format', '%[hex:p{0,0}]', 'info:']).trim().slice(0, 6).toUpperCase();
        fs.writeFileSync(
            path.join(res, 'values/ic_launcher_background.xml'),
            `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#${corner}</color>\n</resources>\n`
        );
        console.log(
            `[app-icon] ${path.relative(root, source)}: ${ios.size} iOS sizes, ${Object.keys(DENSITIES).length} Android densities, background #${corner}`
        );
        return { ios: [...ios.keys()], background: `#${corner}` };
    } finally {
        fs.rmSync(master, { force: true });
    }
}

module.exports = { generate, imageMagick };

if (require.main === module) {
    try {
        generate(process.argv[2] ? path.resolve(process.argv[2]) : undefined);
    } catch (error) {
        console.error(`[app-icon] ${error.message}`);
        process.exit(1);
    }
}
