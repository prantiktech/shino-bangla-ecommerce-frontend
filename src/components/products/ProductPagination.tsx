"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const ProductPagination: React.FC<ProductPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [jumpPage, setJumpPage] = useState("");

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpPage("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-10 pb-6 border-t border-gray-100 mt-8">
      {/* Pagination Page Numbers */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Previous Page"
          className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page 1 */}
        <button
          onClick={() => onPageChange(1)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
            currentPage === 1
              ? "bg-primary text-white shadow-xs"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          1
        </button>

        {/* Page 2 */}
        <button
          onClick={() => onPageChange(2)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
            currentPage === 2
              ? "bg-primary text-white shadow-xs"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          2
        </button>

        {/* Page 3 */}
        <button
          onClick={() => onPageChange(3)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
            currentPage === 3
              ? "bg-primary text-white shadow-xs"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          3
        </button>

        <span className="text-gray-400 text-xs px-1 select-none">...</span>

        {/* Page 98 */}
        <button
          onClick={() => onPageChange(98)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
            currentPage === 98
              ? "bg-primary text-white shadow-xs"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          98
        </button>

        {/* Page 99 */}
        <button
          onClick={() => onPageChange(99)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
            currentPage === 99
              ? "bg-primary text-white shadow-xs"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          99
        </button>

        {/* Page 100 */}
        <button
          onClick={() => onPageChange(100)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
            currentPage === 100
              ? "bg-primary text-white shadow-xs"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          100
        </button>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Next Page"
          className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Go to Jump Input Form */}
      <form onSubmit={handleJump} className="flex items-center gap-2 text-xs text-gray-500">
        <span>Go to:</span>
        <input
          type="number"
          min="1"
          max={totalPages}
          value={jumpPage}
          onChange={(e) => setJumpPage(e.target.value)}
          placeholder="Page"
          className="w-16 h-7 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-xs"
        />
        <span>of {totalPages}</span>
        {jumpPage && (
          <button
            type="submit"
            className="px-2 py-1 bg-primary text-white rounded text-[11px] font-bold"
          >
            Go
          </button>
        )}
      </form>
    </div>
  );
};
