const previewDialog = document.querySelector('#preview-info');
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-preview-link]');
  if (!link) return;
  event.preventDefault();
  previewDialog.showModal();
});
