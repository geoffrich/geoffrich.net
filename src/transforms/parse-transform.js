const jsdom = require('@tbranyen/jsdom');
const {JSDOM} = jsdom;
const minify = require('../utils/minify.js');
const slugify = require('slugify');
const getSize = require('image-size');

module.exports = function(value, outputPath) {
  if (outputPath.endsWith('.html')) {
    const DOM = new JSDOM(value, {
      resources: 'usable'
    });

    const document = DOM.window.document;
    const articleImages = [...document.querySelectorAll('main article img')];
    const articleHeadings = [
      ...document.querySelectorAll('main article h2, main article h3')
    ];
    const articleEmbeds = [...document.querySelectorAll('main article iframe')];

    if (articleImages.length) {
      articleImages.forEach(image => {
        image.setAttribute('loading', 'lazy');

        const file = image.getAttribute('src');

        if (file.indexOf('http') < 0) {
          const dimensions = getSize('src' + file);

          image.setAttribute('width', dimensions.width);
          image.setAttribute('height', dimensions.height);
        }

        // Make gifs play/pause on click
        // https://christianheilmann.com/2020/07/16/a-css-only-click-to-animate-gif-solution/
        if (file.indexOf('.gif') >= 0) {
          const label = document.createElement('label');
          label.classList.add('click-to-gif');
          label.title = 'click/hit space to show gif';

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.setAttribute('checked', 'true');
          checkbox.classList.add('visually-hidden');

          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.innerHTML = `<path d="M1288.678 637.83q0 37-33 56l-512 288q-14 8-31 8t-32-9q-32-18-32-55v-576q0-37 32-55 31-20 63-1l512 288q33 19 33 56zm128 0q0-104-40.5-198.5t-109.5-163.5q-69-69-163.5-109.5t-198.5-40.5q-104 0-198.5 40.5t-163.5 109.5q-69 69-109.5 163.5t-40.5 198.5q0 104 40.5 198.5t109.5 163.5q69 69 163.5 109.5t198.5 40.5q104 0 198.5-40.5t163.5-109.5q69-69 109.5-163.5t40.5-198.5zm256 0q0 209-103 385.5t-279.5 279.5q-176.5 103-385.5 103t-385.5-103q-176.5-103-279.5-279.5t-103-385.5q0-209 103-385.5t279.5-279.5q176.5-103 385.5-103t385.5 103q176.5 103 279.5 279.5t103 385.5z" fill="var(--svg-fill)"/>`;
          svg.setAttribute('viewBox', '0 -256 1792 1792');
          svg.setAttribute('aria-hidden', 'true');

          label.appendChild(checkbox);
          label.appendChild(svg);
          label.appendChild(image.cloneNode(true));

          image.replaceWith(label);
        }

        // If an image has a title it means that the user added a caption
        // so replace the image with a figure containing that image and a caption
        if (image.hasAttribute('title')) {
          const figure = document.createElement('figure');
          const figCaption = document.createElement('figcaption');

          figCaption.innerHTML = image.getAttribute('title');

          image.removeAttribute('title');

          figure.appendChild(image.cloneNode(true));
          figure.appendChild(figCaption);

          image.replaceWith(figure);
        }
      });
    }

    if (articleHeadings.length) {
      // Loop each heading and add a little anchor and an ID to each one
      articleHeadings.forEach(heading => {
        const headingSlug = slugify(heading.textContent.toLowerCase());
        const anchor = document.createElement('a');

        anchor.setAttribute('href', `#heading-${headingSlug}`);
        anchor.classList.add('heading-permalink');
        anchor.innerHTML = minify(`
        <span class="visually-hidden"> permalink</span>
        <svg fill="currentColor" aria-hidden="true" focusable="false" width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M9.199 13.599a5.99 5.99 0 0 0 3.949 2.345 5.987 5.987 0 0 0 5.105-1.702l2.995-2.994a5.992 5.992 0 0 0 1.695-4.285 5.976 5.976 0 0 0-1.831-4.211 5.99 5.99 0 0 0-6.431-1.242 6.003 6.003 0 0 0-1.905 1.24l-1.731 1.721a.999.999 0 1 0 1.41 1.418l1.709-1.699a3.985 3.985 0 0 1 2.761-1.123 3.975 3.975 0 0 1 2.799 1.122 3.997 3.997 0 0 1 .111 5.644l-3.005 3.006a3.982 3.982 0 0 1-3.395 1.126 3.987 3.987 0 0 1-2.632-1.563A1 1 0 0 0 9.201 13.6zm5.602-3.198a5.99 5.99 0 0 0-3.949-2.345 5.987 5.987 0 0 0-5.105 1.702l-2.995 2.994a5.992 5.992 0 0 0-1.695 4.285 5.976 5.976 0 0 0 1.831 4.211 5.99 5.99 0 0 0 6.431 1.242 6.003 6.003 0 0 0 1.905-1.24l1.723-1.723a.999.999 0 1 0-1.414-1.414L9.836 19.81a3.985 3.985 0 0 1-2.761 1.123 3.975 3.975 0 0 1-2.799-1.122 3.997 3.997 0 0 1-.111-5.644l3.005-3.006a3.982 3.982 0 0 1 3.395-1.126 3.987 3.987 0 0 1 2.632 1.563 1 1 0 0 0 1.602-1.198z"/>
        </svg>`);

        heading.setAttribute('id', `heading-${headingSlug}`);
        heading.appendChild(anchor);
      });
    }

    // Look for videos are wrap them in a container element
    if (articleEmbeds.length) {
      articleEmbeds.forEach(embed => {
        if (embed.hasAttribute('allowfullscreen')) {
          const player = document.createElement('div');

          player.classList.add('video-player');

          player.appendChild(embed.cloneNode(true));

          embed.replaceWith(player);
        }
      });
    }

    return '<!DOCTYPE html>\r\n' + document.documentElement.outerHTML;
  }
  return value;
};
