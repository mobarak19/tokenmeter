// Read an image's pixel size locally (respects EXIF orientation). Nothing is uploaded.
export function mountImageDrop(zone: HTMLElement, onImage: (w: number, h: number, name: string) => void) {
  const input = zone.querySelector<HTMLInputElement>('input[type=file]')!;
  const read = async (f?: File) => {
    if (!f) return;
    try {
      const bmp = await createImageBitmap(f);
      onImage(bmp.width, bmp.height, f.name);
      bmp.close();
      zone.querySelector<HTMLElement>('[data-drop-name]')!.textContent = `${f.name}: ${bmp.width} × ${bmp.height} px`;
    } catch {
      zone.querySelector<HTMLElement>('[data-drop-name]')!.textContent = 'This browser can’t read that image format. Enter the pixel size instead.';
    }
  };
  input.addEventListener('change', () => void read(input.files?.[0]));
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
  zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('drag'); void read(e.dataTransfer?.files[0]); });
}
