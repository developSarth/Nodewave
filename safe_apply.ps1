$baseDir = "d:\nodewave\Website"

# Clean CSS/JS for injection
$globalCss = @"
<style id="agy-enhancements">
  /* Roadmap glow and mobile menu */
  .glow-card { transition: all 0.4s cubic-bezier(.16, 1, .3, 1); position: relative; }
  .glow-card:hover { transform: translateY(-8px); box-shadow: 0 15px 35px rgba(255,67,0,0.15), inset 0 0 20px rgba(255,255,255,0.05); border-color: rgba(255,67,0,0.3); }

  .hamburger { display: none; background: none; border: none; cursor: pointer; padding: 10px; z-index: 1001; }
  .hamburger span { display: block; width: 24px; height: 2px; background: var(--fog); margin-bottom: 5px; transition: 0.3s; }
  .hamburger.is-active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .hamburger.is-active span:nth-child(2) { opacity: 0; }
  .hamburger.is-active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  .mobile-menu-overlay { position: fixed; inset: 0; background: rgba(21,10,13,0.95); backdrop-filter: blur(10px); z-index: 1000; display: flex; flex-direction: column; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: opacity 0.4s; }
  .mobile-menu-overlay.is-active { opacity: 1; pointer-events: auto; }
  .mobile-menu-overlay a { font-family: 'Cormorant Garamond', serif; font-size: 28px; color: #fff; margin: 15px 0; text-decoration: none; opacity: 0; transform: translateY(20px); transition: 0.3s; }
  .mobile-menu-overlay.is-active a { opacity: 1; transform: translateY(0); }

  @media (max-width: 860px) {
    .navlinks { display: none !important; }
    .hamburger { display: block; }
  }
</style>
"@

$leftAlignCss = @"
<style id="agy-left-align">
  .page-hero .wrap { text-align: left !important; align-items: flex-start; }
  .page-hero { justify-content: flex-start !important; }
</style>
"@

$mobileJs = @"
<script id="agy-js">
  document.addEventListener('DOMContentLoaded', () => {
    if(!document.querySelector('.hamburger')) {
      const nav = document.querySelector('.navbar');
      if(nav) {
        const btn = document.createElement('button');
        btn.className = 'hamburger';
        btn.innerHTML = '<span></span><span></span><span></span>';
        nav.appendChild(btn);

        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        overlay.innerHTML = '<a href="/solutions">Solutions</a><a href="/industries">Industries</a><a href="/about">About</a><a href="/case-studies">Case Studies</a><a href="/contact">Contact</a>';
        document.body.appendChild(overlay);

        btn.addEventListener('click', () => {
          btn.classList.toggle('is-active');
          overlay.classList.toggle('is-active');
          if(overlay.classList.contains('is-active')) {
            gsap.fromTo(overlay.querySelectorAll('a'), {opacity: 0, y: 20}, {opacity: 1, y: 0, stagger: 0.1, duration: 0.5});
          }
        });
      }
    }

    gsap.utils.toArray('.related-card, .industry-card, .wf-card, .zigzag-row').forEach(card => {
      card.classList.add('glow-card');
      const dot = card.querySelector('.dot');
      if(dot) {
        gsap.fromTo(dot, {scale: 0, opacity: 0}, {scale: 1, opacity: 1, scrollTrigger: {trigger: card, start: 'top 80%'}});
      }
    });
  });
</script>
"@

$files = Get-ChildItem -Path $baseDir -Recurse -Filter '*.html'
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Encoding UTF8 -Raw
    
    # Preloader Removal: Remove HTML and replace JS block safely
    $content = $content -replace '(?s)<div id="preloader">.*?</div>\s*<!-- ============ NAV ============ -->', '<!-- ============ NAV ============ -->'
    $content = $content -replace '(?s)<div id="preloader">.*?</div>\s*<header>', '<header>'
    $content = $content -replace '(?s)/\* ---------- PRELOADER ---------- \*/.*?/\* ---------- CURSOR ---------- \*/', "/* ---------- PRELOADER REMOVED ---------- */`n      setTimeout(() => { if(typeof playIntro === 'function') playIntro(); }, 100);`n`n      /* ---------- CURSOR ---------- */"

    # Logo replacement
    $logoRepl = '<img src="/oglogo.svg" alt="Nodewave Logo" style="height: 24px; width: auto; margin-right: 8px;"><b>Nodewave</b>'
    $content = $content -replace '<b>Nodewave</b>', $logoRepl

    # Injections
    $content = $content.Replace('</head>', "`n$globalCss`n</head>")
    $content = $content.Replace('</body>', "`n$mobileJs`n</body>")

    # Left align for subpages
    if ($file.FullName -ne "$baseDir\index.html") {
        $content = $content.Replace('</head>', "`n$leftAlignCss`n</head>")
    }

    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
}

Write-Host "Global changes applied."
