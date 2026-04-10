interface CardProps {
    children: React.ReactNode;
};

export default function Card({ children }: CardProps) {
  return (
    <section className="Card">
      <div> 
        {children}
      </div>
    </section>
  );
}