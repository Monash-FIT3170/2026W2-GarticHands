interface CardProps {
    children: React.ReactNode;
};

export default function Card({ children }: CardProps) {
  return (
    <section className="w-[300px] m-5 p-5 border-2 border-grey-500 rounded-[10px] shadow-lg bg-white">
      <div> 
        {children}
      </div>
    </section>
  );
}