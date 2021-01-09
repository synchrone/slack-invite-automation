const title = 'slack';

function width(str) {
    return 6 * str.length;
}

module.exports = {
    badge: function(presence, total, customColorA, customColorB) {
        const value = `${presence}/${total}`;
        const left = width(title) + 8;
        const wd = left + width(value) + 22;
        const colorA = customColorA || '555';
        const colorB = customColorB || '39AE85';

        const tmpl = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${wd}" height="20">
      <linearGradient x2="0" y2="100%" id="b"><stop offset="0" stop-color="#bbb" stop-opacity=".1"></stop><stop offset="1" stop-opacity=".1"></stop></linearGradient>
      <clipPath id="a"><rect width="84" height="20" rx="3" fill="#fff"></rect></clipPath>
      <g clip-path="url(#a)">
        <path fill="#${colorA}" d="${'M0 0h' + left + 'v20H0z'}"></path>
        <path fill="#${colorB}" d="${'M'+left + ' 0h' + (wd-left) + 'v20H' + left +'z'}"></path>
        <path fill="url(#b)" d="${'M0 0h' + wd + 'v20H0z'}"></path>
      </g>
      <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110">
        <text x="195" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${title.length*54}">${title}</text>
        <text x="195" y="140" transform="scale(.1)" textLength="${title.length*54}">slack</text>
        <text x="${wd * 5 + 195}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="240">${value}</text>
        <text x="${wd * 5 + 195}" y="140" transform="scale(.1)" textLength="240">0/10</text>
      </g>
    </svg>`

        return tmpl
    },
};
