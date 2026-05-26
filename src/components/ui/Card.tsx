import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const padMap = { none: "", sm: "p-3", md: "p-5", lg: "p-6" };

export default function Card({ children, className = "", onClick, hover = false, padding = "md" }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white border border-slate-200 rounded-2xl shadow-sm
        ${hover ? "hover:shadow-md hover:border-slate-300 cursor-pointer transition-all duration-200" : ""}
        ${padMap[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
