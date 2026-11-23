const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { generate, imageMagick } = require('../scripts/generate-app-icon');

const root = path.resolve(__dirname, '..');
let im = null;
try {
    im = imageMagick();
} catch {
    // CI without ImageMagick: the build machines install it before generating.
}
const maybe = im ? test : test.skip;

const info = (file, format) => execFileSync(im, [file, '-depth', '8', '-format', format, 'info:'], { encoding: 'utf8' }).trim();

describe('generate:app-icon', () => {
    let dir;
    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-icon-'));
        for (const sub of ['ios/PassengerApp/Images.xcassets/AppIcon.appiconset', 'android/app/src/main/res/values'])
            fs.mkdirSync(path.join(dir, sub), { recursive: true });
        fs.copyFileSync(
            path.join(root, 'ios/PassengerApp/Images.xcassets/AppIcon.appiconset/Contents.json'),
            path.join(dir, 'ios/PassengerApp/Images.xcassets/AppIcon.appiconset/Contents.json')
        );
    });
    afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

    maybe(
        'writes every size, opaque for the App Store, from a non-square image with transparency',
        () => {
            const source = path.join(dir, 'icon.png');
            // 1200×1024, yellow, with a transparent top-left corner inside the square that's kept.
            execFileSync(im, [
                '-size',
                '1200x1024',
                'xc:#F5C518',
                '-alpha',
                'set',
                '(',
                '-size',
                '120x20',
                'xc:none',
                ')',
                '-geometry',
                '+0+0',
                '-compose',
                'Copy',
                '-composite',
                source,
            ]);

            const result = generate(source, dir);
            const iconSet = path.join(dir, 'ios/PassengerApp/Images.xcassets/AppIcon.appiconset');
            expect(result.ios).toEqual(expect.arrayContaining(['icon-1024.png', 'icon-180.png', 'icon-40.png']));
            expect(info(path.join(iconSet, 'icon-1024.png'), '%wx%h %[opaque]')).toBe('1024x1024 True');
            expect(info(path.join(iconSet, 'icon-87.png'), '%wx%h')).toBe('87x87');
            // The transparent corner is filled with white, so the background layer is white too.
            expect(info(path.join(iconSet, 'icon-1024.png'), '%[hex:p{0,0}]').slice(0, 6)).toBe('FFFFFF');
            expect(result.background).toBe('#FFFFFF');

            const res = path.join(dir, 'android/app/src/main/res');
            expect(info(path.join(res, 'mipmap-mdpi/ic_launcher.png'), '%wx%h')).toBe('48x48');
            expect(info(path.join(res, 'mipmap-xxxhdpi/ic_launcher_foreground.png'), '%wx%h')).toBe('432x432');
            expect(info(path.join(res, 'mipmap-xxxhdpi/ic_launcher_round.png'), '%[fx:p{2,2}.a] %[fx:p{96,96}.a]')).toBe('0 1');
            expect(fs.readFileSync(path.join(res, 'values/ic_launcher_background.xml'), 'utf8')).toContain('#FFFFFF');
        },
        120_000
    );

    maybe('says what to add when there is no icon', () => {
        expect(() => generate(undefined, dir)).toThrow('No icon at brand/app-icon.png');
    });
});
