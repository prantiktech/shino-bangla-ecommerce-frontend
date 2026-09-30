import { Category, SubCategory } from "@/types";
import { ApiCategory } from "@/app/(user)/actions/categories";

export function mapApiCategoryToCategory(apiCat: ApiCategory): Category {
  return {
    id: String(apiCat.id),
    name: apiCat.name,
    slug: apiCat.slug,
    icon: apiCat.icon || "Shield",
    subCategories: (apiCat.children || []).map((sub) => ({
      id: String(sub.id),
      name: sub.name,
      slug: sub.slug,
      icon: sub.icon || undefined,
      itemCount: sub.product_count || 0,
    })),
    isSpecial: false,
  };
}
