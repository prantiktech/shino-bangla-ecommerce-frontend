import { Category } from "@/types";
import { ApiCategory } from "@/app/(user)/actions/categories";
import { imageSrc } from "@/lib/utils/image";

export function mapApiCategoryToCategory(apiCat: ApiCategory): Category {
  const iconUrl = imageSrc(apiCat.icon, "thumb", "");
  const bannerUrl = imageSrc(apiCat.banner, "full", "");

  return {
    id: String(apiCat.id),
    name: apiCat.name,
    slug: apiCat.slug,
    icon: iconUrl || "Shield",
    banner: bannerUrl || undefined,
    productCount: apiCat.product_count || 0,
    subCategories: (apiCat.children || []).map((sub) => {
      const subIconUrl = imageSrc(sub.icon, "thumb", "");
      const subBannerUrl = imageSrc(sub.banner, "full", "");
      return {
        id: String(sub.id),
        name: sub.name,
        slug: sub.slug,
        icon: subIconUrl || undefined,
        banner: subBannerUrl || undefined,
        itemCount: sub.product_count || 0,
      };
    }),
    isSpecial: false,
  };
}
