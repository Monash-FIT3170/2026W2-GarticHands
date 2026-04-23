interface CardProps {
    children: React.ReactNode;
};

export default function CardNoCss({ children }: CardProps) {
  return (
    <section className="CardNoCss">
      <div> 
        {children}
      </div>
    </section>
  );
}