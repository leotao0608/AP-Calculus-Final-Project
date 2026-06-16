function showSignature(name) {
  const img = document.getElementById('signature-img');
  const formula = document.getElementById('signature-formula');

  if (name === 'xichen') {
    img.src = 'signature_xichen.png';

    formula.innerHTML =
      '\\(X\\int\\subset\\in\\eta\\;\\;\\;\\mathrm{T}\\Delta\\infty\\)';
    formula.style.display = 'block';
  } else {
    img.src = 'signature_allen.png';

    formula.innerHTML = '';
    formula.style.display = 'none';
  }

  document.getElementById('signature-card').classList.add('open');

  MathJax.typesetPromise([formula]);
}

function showVideo() {
  document.getElementById('video-card').classList.add('open');
}

function closeVideo() {
  const video = document.getElementById('demo-video');
  video.pause();
  video.currentTime = 0;
  document.getElementById('video-card').classList.remove('open');
}