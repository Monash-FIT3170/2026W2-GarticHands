import './CardWithCss.css'

interface CardProps {
    children: React.ReactNode;
};

export default function CardWithCss({ children }: CardProps) {
  return (
    <section className="CardWithCss">
      <div> 
        {children}
      </div>
    </section>
  );
}