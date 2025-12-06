import Image from "next/image";

/**
 * Configuration for a single image in the hero grid
 */
interface ImageConfig {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  priority: boolean;
  gridClasses: string;
}

/**
 * Static configuration for all 4 images in the hero grid
 */
const GRID_IMAGES: ReadonlyArray<ImageConfig> = [
  {
    id: "coffee",
    src: "https://placehold.co/600x400/ff6b35/fff",
    alt: "Cozy coffee shop interior with warm lighting",
    width: 600,
    height: 400,
    priority: true,
    gridClasses: "col-span-1 row-span-1",
  },
  {
    id: "library",
    src: "https://placehold.co/400x800/004e89/fff",
    alt: "Tall library shelves filled with books",
    width: 400,
    height: 800,
    priority: true,
    gridClasses: "col-span-1 md:row-span-2",
  },
  {
    id: "market",
    src: "https://placehold.co/600x400/2a9d8f/fff",
    alt: "Vibrant outdoor farmers market with fresh produce",
    width: 600,
    height: 400,
    priority: false,
    gridClasses: "col-span-1 row-span-1",
  },
  {
    id: "gallery",
    src: "https://placehold.co/1200x400/9b59b6/fff",
    alt: "Sunlit art gallery with white walls and paintings",
    width: 1200,
    height: 400,
    priority: false,
    gridClasses: "col-span-1 md:col-span-2 md:row-span-1",
  },
] as const;

/**
 * Hero Image Grid Component
 *
 * Displays a responsive grid of 4 placeholder images for the landing page.
 * Server-rendered for optimal performance with no client-side JavaScript.
 */
export default function HeroImageGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:grid-rows-[auto_auto] md:gap-6">
      {GRID_IMAGES.map((image) => (
        <div key={image.id} className={image.gridClasses}>
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            priority={image.priority}
            className="h-full w-full rounded-lg object-cover"
          />
        </div>
      ))}
    </div>
  );
}
