export type PropertyPhoto = {
  alt: string;
  src: string;
};

const photoParams = "auto=format&fit=crop&w=1200&q=80";

// Sample exterior photos for the sample portfolio. Addresses are Monopoly board
// spaces — a tongue-in-cheek nod that this is sample data, not a real portfolio.
export const samplePropertyPhotos: Record<string, PropertyPhoto> = {
  boardwalk: {
    alt: "Sample exterior photo for Boardwalk",
    src: `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?${photoParams}`,
  },
  "park place": {
    alt: "Sample exterior photo for Park Place",
    src: `https://images.unsplash.com/photo-1570129477492-45c003edd2be?${photoParams}`,
  },
  "marvin gardens": {
    alt: "Sample exterior photo for Marvin Gardens",
    src: `https://images.unsplash.com/photo-1580587771525-78b9dba3b914?${photoParams}`,
  },
  "baltic avenue": {
    alt: "Sample exterior photo for Baltic Avenue",
    src: `https://images.unsplash.com/photo-1568605114967-8130f3a36994?${photoParams}`,
  },
  "pennsylvania avenue": {
    alt: "Sample exterior photo for Pennsylvania Avenue",
    src: `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?${photoParams}`,
  },
  "reading railroad": {
    alt: "Sample exterior photo for Reading Railroad",
    src: `https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?${photoParams}`,
  },
};

export function propertyPhotoForAddress(address: string): PropertyPhoto {
  return (
    samplePropertyPhotos[normalizeAddress(address)] ?? {
      alt: `Sample exterior photo for ${address}`,
      src: samplePropertyPhotos.boardwalk.src,
    }
  );
}

function normalizeAddress(address: string) {
  return address.trim().toLowerCase();
}
