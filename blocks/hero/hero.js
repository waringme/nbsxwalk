/**
 * Hero block — split layout (image + text) matches NBS hero-banner behaviour.
 */
export default function decorate(block) {
  const firstRow = block.querySelector(':scope > div:first-child');
  const hasImage = firstRow && firstRow.querySelector('picture, img');
  if (!hasImage) {
    block.classList.add('no-image');
  }
}
