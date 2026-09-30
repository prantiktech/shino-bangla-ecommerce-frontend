import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Calendar, User, ArrowRight } from "lucide-react";

const BLOG_POSTS = [
  {
    id: "blog-1",
    title: "How to Choose the Best Electric Ride-On Car for Your Child in 2026",
    slug: "choose-best-electric-ride-on-car",
    excerpt: "Safety features, battery voltages (6V vs 12V vs 24V), remote control overrides, and terrain compatibility explained.",
    image: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=80",
    date: "Aug 28, 2026",
    author: "Toy House Expert",
    category: "Parenting Guide"
  },
  {
    id: "blog-2",
    title: "The Benefits of Montessori Wooden Toys for Early Childhood Development",
    slug: "montessori-toys-benefits-early-development",
    excerpt: "Discover why sensory open-ended toys encourage cognitive problem-solving, focus, and creativity better than screen time.",
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&auto=format&fit=crop&q=80",
    date: "Aug 20, 2026",
    author: "Child Psychologist",
    category: "Learning & STEM"
  },
  {
    id: "blog-3",
    title: "Baby Stroller Buying Guide: Compact, Jogging, or All-Terrain?",
    slug: "baby-stroller-complete-buying-guide",
    excerpt: "Everything you need to know about safety harnesses, canopy sun protection, suspension systems, and travel foldability.",
    image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600&auto=format&fit=crop&q=80",
    date: "Aug 15, 2026",
    author: "Pediatric Care Team",
    category: "Baby Essentials"
  }
];

export default function BlogsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20">
      <Breadcrumb
        items={[
          { label: "Pages", href: "/blogs" },
          { label: "Blogs" },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Toy House Blog & Parenting Hub
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
            Insights, guides, toy reviews, and developmental tips from parenting experts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <span className="absolute top-3 left-3 bg-[#FF5B00] text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                  {post.category}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {post.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {post.author}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 group-hover:text-[#FF5B00] transition-colors line-clamp-2 mb-2 leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                </div>

                <Link
                  href={`/blogs/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5B00] hover:text-[#E64E00] transition-colors"
                >
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
