import React from "react";
import {
  Car,
  Baby,
  Gamepad2,
  Milk,
  Sparkles,
  SunMedium,
  Calendar,
  GraduationCap,
  Radio,
  Bike,
  Armchair,
  Music,
  Shield,
  HeartHandshake,
  Smile,
  Package,
  Layers,
  LucideIcon
} from "lucide-react";

import { ImageLike, imageAlt, imageSrc, isImageUrl } from "@/lib/utils/image";

const ICON_MAP: Record<string, LucideIcon> = {
  Car,
  Baby,
  Gamepad2,
  Milk,
  Sparkles,
  SunMedium,
  Calendar,
  GraduationCap,
  Radio,
  Bike,
  Armchair,
  Music,
  Shield,
  HeartHandshake,
  Smile,
  Package,
  Layers
};

interface CategoryIconProps {
  name?: ImageLike;
  alt?: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  alt = "",
  className = "w-5 h-5",
}) => {
  if (name && typeof name === "object") {
    const src = imageSrc(name, "thumb", "");
    if (src) {
      return (
        <img
          src={src}
          alt={imageAlt(name, alt)}
          className={`${className} object-contain rounded`}
          loading="lazy"
        />
      );
    }
  }

  if (typeof name === "string" && isImageUrl(name)) {
    return (
      <img
        src={name}
        alt={alt}
        className={`${className} object-contain rounded`}
        loading="lazy"
      />
    );
  }

  const iconKey = typeof name === "string" && name ? name : "Package";
  const IconComponent = ICON_MAP[iconKey] || Package;
  return <IconComponent className={className} />;
};
