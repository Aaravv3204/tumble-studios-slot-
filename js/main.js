(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // --- Mobile nav
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  function closeNav() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeNav();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      closeNav();
      toggle.focus();
    }
  });

  // --- Highlight the nav link for the section in view
  var links = Array.prototype.slice.call(nav.querySelectorAll('ul a[href^="#"]'));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) current = entry.target.id;
      });
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + current;
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  // --- Headline cascade: split each line into letters that drop in one by one.
  // The h1 carries aria-label, so the split spans are hidden from screen readers.
  var cascadeIndex = 0;
  Array.prototype.forEach.call(document.querySelectorAll('[data-cascade]'), function (line) {
    var text = line.textContent;
    line.textContent = '';
    for (var i = 0; i < text.length; i++) {
      var span = document.createElement('span');
      span.className = 'letter';
      span.textContent = text[i];
      span.style.setProperty('--i', String(cascadeIndex++));
      line.appendChild(span);
    }
  });

  // --- Hero video: pause button, reduced motion, and stop when off screen
  var video = document.querySelector('.hero-video');
  var videoToggle = document.querySelector('.video-toggle');

  function setPaused(paused) {
    if (paused) video.pause(); else video.play().catch(function () {});
    videoToggle.setAttribute('aria-pressed', String(paused));
    videoToggle.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
  }

  if (video && videoToggle) {
    var userPaused = false;

    if (reduceMotion.matches) {
      video.removeAttribute('autoplay');
      userPaused = true;
      setPaused(true);
    }

    videoToggle.addEventListener('click', function () {
      userPaused = !userPaused;
      setPaused(userPaused);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (userPaused) return;
          if (entry.isIntersecting) video.play().catch(function () {});
          else video.pause();
        });
      }, { threshold: 0.1 }).observe(video);
    }
  }

  // --- Reel strip on the game card: advances every few seconds, and on hover
  var reel = document.querySelector('[data-reel]');
  if (reel && !reduceMotion.matches) {
    var track = reel.querySelector('.reel-track');
    var dots = reel.querySelectorAll('.reel-dots li');
    var frames = track.children.length;
    var at = 0;
    var timer = null;

    function go(n) {
      at = (n + frames) % frames;
      track.style.transform = 'translateY(' + (-at * 100 / frames) + '%)';
      Array.prototype.forEach.call(dots, function (d, i) {
        d.classList.toggle('is-on', i === at);
      });
    }

    function schedule() {
      clearInterval(timer);
      timer = setInterval(function () { go(at + 1); }, 3800);
    }

    reel.addEventListener('mouseenter', function () { go(at + 1); schedule(); });
    schedule();
  }

  // --- Contact form: inline validation and a confirmation message.
  // There is no backend yet; replace the "sent" branch with a real request.
  function wireForm(form, successText) {
    var note = form.querySelector('.form-note');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea'));
      var firstBad = null;

      fields.forEach(function (f) {
        var ok = f.checkValidity();
        f.setAttribute('aria-invalid', String(!ok));
        if (!ok && !firstBad) firstBad = f;
      });

      if (firstBad) {
        note.className = 'form-note is-error';
        note.textContent = 'Please check the highlighted field: ' + labelFor(firstBad) + '.';
        firstBad.focus();
        return;
      }

      note.className = 'form-note is-ok';
      note.textContent = successText;
      form.reset();
      fields.forEach(function (f) { f.removeAttribute('aria-invalid'); });
    });

    form.addEventListener('input', function (e) {
      var f = e.target;
      if (f.getAttribute('aria-invalid') === 'true' && f.checkValidity()) {
        f.setAttribute('aria-invalid', 'false');
      }
    });
  }

  function labelFor(field) {
    var label = field.id && document.querySelector('label[for="' + field.id + '"]');
    return label ? label.textContent.trim().toLowerCase() : 'this field';
  }

  var contact = document.querySelector('.contact-form');
  if (contact) wireForm(contact, 'Message sent. We reply within two working days.');
})();
