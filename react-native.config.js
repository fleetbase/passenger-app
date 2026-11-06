const fs = require('fs');
const path = require('path');

// brand/fonts: a client build's own font files, named by PostScript name.
const brandFonts = path.join(__dirname, 'brand', 'fonts');

module.exports = {
    assets: ['./assets/fonts', ...(fs.existsSync(brandFonts) ? ['./brand/fonts'] : [])],
};
