const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (dirPath.endsWith('.html')) {
      callback(dirPath);
    }
  });
}

const baseDir = path.join(__dirname);

walkDir(baseDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Fix .navlinks a font
  content = content.replace(
    /\.navlinks a\s*\{/,
    `.navlinks a {\n      font-family: 'Cormorant Garamond', serif !important;`
  );

  // 2. Fix .nav-cta font
  content = content.replace(
    /font-family:\s*'Manrope',\s*serif;/g,
    `font-family: 'Cormorant Garamond', serif !important;`
  );

  // 3. Add will-change to .reveal
  content = content.replace(
    /\.reveal\s*\{\s*opacity:\s*0;\s*transform:\s*translateY\(28px\);\s*\}/g,
    `.reveal { opacity: 0; transform: translateY(28px); will-change: transform, opacity; }`
  );

  // 4. Update JS playIntro
  // In index.html: it uses `.hero-inner .reveal`
  // In subpages: it uses `.reveal` which is a bug. We change it to `.page-hero .reveal, .hero-inner .reveal`
  // We need to match both multiline and minified versions.

  // First, find the playIntro function block
  const playIntroMatch = content.match(/function\s+playIntro\s*\(\)\s*\{[\s\S]*?\}/);
  if (playIntroMatch) {
    let newPlayIntro = `function playIntro() {
      const tl = gsap.timeline({ defaults: { ease: 'back.out(1.2)' } });
      tl.to('.hero-inner .reveal, .page-hero .reveal', { opacity: 1, y: 0, duration: 1, stagger: 0.09 });
      gsap.to('header', { opacity: 1, duration: 0.8 });
    }`;
    content = content.replace(playIntroMatch[0], newPlayIntro);
  }

  // 5. Update ScrollTrigger for .reveal
  // In index.html: 
  /*
    gsap.utils.toArray('.reveal').forEach(el => {
      if (el.closest('.hero-inner')) return;
      gsap.to(el, {
        opacity: 1, y: 0, duration: .9, ease: 'back.out(1.2)',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
  */
  // In subpages:
  /*
    gsap.utils.toArray('.reveal').forEach(el=>{gsap.to(el,{opacity:1,y:0,duration:.9,ease:'back.out(1.2)',scrollTrigger:{trigger:el,start:'top 88%'}})});
  */
  // We will replace both by targeting the gsap.utils.toArray('.reveal').forEach block
  const scrollTriggerMatch = content.match(/gsap\.utils\.toArray\('\.reveal'\)\.forEach\([^)]+\)\s*=>\s*\{[\s\S]*?scrollTrigger:\s*\{\s*trigger:\s*el\s*,\s*start:\s*'top 88%'\s*\}\s*\}\s*\)\s*;?\s*\}\s*\)/) 
      || content.match(/gsap\.utils\.toArray\('\.reveal'\)\.forEach\(el=>\{gsap\.to\(el,\{opacity:1,y:0,duration:\.9,ease:'back\.out\(1\.2\)',scrollTrigger:\{trigger:el,start:'top 88%'\}\}\)\}\)/)
      || content.match(/gsap\.utils\.toArray\('\.reveal'\)\.forEach\([\s\S]*?start:\s*'top 88%'\s*\}\s*\)\s*\}\);?/);

  if (scrollTriggerMatch) {
    let newScrollTrigger = `
    ScrollTrigger.batch('.reveal:not(.hero-inner .reveal, .page-hero .reveal)', {
      start: 'top 88%',
      onEnter: batch => gsap.to(batch, {
        opacity: 1, 
        y: 0, 
        duration: 1, 
        stagger: 0.12, 
        ease: 'back.out(1.4)', 
        overwrite: true
      })
    });`;
    content = content.replace(scrollTriggerMatch[0], newScrollTrigger);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
});

console.log("Global fixes applied.");
