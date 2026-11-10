const cargar = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la foto.'));
    };
    img.src = url;
  });

/**
 * Reduce la foto del móvil (3-8 MB) a un JPEG de unos 150 KB en base64, que
 * cabe en un documento de Firestore y sube rápido con mala cobertura.
 */
export async function comprimirFoto(file: File): Promise<string> {
  const img = await cargar(file);
  let lado = 1280;
  let calidad = 0.65;
  for (let intento = 0; intento < 5; intento++) {
    const escala = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * escala);
    canvas.height = Math.round(img.naturalHeight * escala);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/jpeg', calidad);
    if (data.length < 600_000) return data;
    lado = Math.round(lado * 0.8);
    calidad = Math.max(0.4, calidad - 0.1);
  }
  throw new Error('La foto es demasiado grande.');
}
