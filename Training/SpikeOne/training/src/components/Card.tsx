interface CardProps {
    children: React.ReactNode
    className?: String
};

export default function Card({ children, className = '' }: CardProps) {
  return (
    <section className="min-w-[300px] m-5 p-5 border-2 border-grey-500 rounded-[10px] shadow-lg bg-white">
      <div> 
        {children}
      </div>
    </section>
  );
}