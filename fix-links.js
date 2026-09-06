const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(
  /<nav class="navlinks">[\s\S]*?<\/nav>/,
  `<nav class="navlinks">
        <a href="/solutions">Solutions</a>
        <a href="/industries">Industries</a>
        <a href="/about">About</a>
        <a href="/case-studies">Case Studies</a>
      </nav>`
);

content = content.replace(
  /<a href="#contact" class="nav-cta">Let's Start →<\/a>/,
  `<a href="/contact" class="nav-cta">Let's Start →</a>`
);

content = content.replace(
  /<div class="foot-links">[\s\S]*?<\/div>/,
  `<div class="foot-links">
          <a href="/solutions">Solutions</a>
          <a href="/industries">Industries</a>
          <a href="/about">About</a>
          <a href="/case-studies">Case Studies</a>
          <a href="/contact">Contact</a>
        </div>`
);

fs.writeFileSync('index.html', content, 'utf8');
console.log("Done");
