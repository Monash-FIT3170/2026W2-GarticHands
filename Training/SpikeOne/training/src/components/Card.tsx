import type { ReactNode } from "react";
import "./components.css";

type CardProps = {
  children: ReactNode;
};

export default function Card({ children }: CardProps) {
  return <div className="card">{children}</div>;
}