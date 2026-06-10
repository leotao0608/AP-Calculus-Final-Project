function showSignature(name) {
  const img = document.getElementById('signature-img');
  img.src = name === 'xichen' ? 'signature_xichen.png' : 'signature_allen.png';
  document.getElementById('signature-card').classList.add('open');
}